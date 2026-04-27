#!/usr/bin/env python3
"""
Fix SonarCloud S6759: Mark component props as Readonly.
Wraps props type parameters with Readonly<> in React component function signatures.
"""
import re
import sys
import os

# Files to fix (from SonarCloud)
FILES = [
    "app/account/layout.tsx",
    "app/admin/layout.tsx",
    "app/auth/layout.tsx",
    "app/blog/[slug]/page.tsx",
    "app/cars/[make]/[model]/page.tsx",
    "app/checkout/[id]/page.tsx",
    "app/favorites/layout.tsx",
    "app/financing/application/page.tsx",
    "app/garage/dossier/[vin]/page.tsx",
    "app/global-error.tsx",
    "app/mockup/layout.tsx",
    "app/production-readiness/layout.tsx",
    "app/protection-plans/[slug]/page.tsx",
    "app/protection-plans/product-details-section.tsx",
    "app/protection-plans/products-grid-with-details.tsx",
    "app/protection-plans/protection-faq-accordion.tsx",
    "app/studio/[[...tool]]/layout.tsx",
    "app/track/[id]/page.tsx",
    "app/vehicles/[id]/layout.tsx",
    "app/vehicles/[id]/page.tsx",
    "app/vehicles/[id]/vdp-client.tsx",
    "components/admin/ai-knowledge-panel.tsx",
    "components/admin/lead-analytics-dashboard.tsx",
    "components/admin/vehicle-photo-manager.tsx",
    "components/auth-required-modal.tsx",
    "components/blog-page-content.tsx",
    "components/blog/blog-share-buttons.tsx",
    "components/checkout.tsx",
    "components/checkout/checkout-flow.tsx",
    "components/checkout/protection-plan-selector.tsx",
    "components/checkout/purchase-sidebar.tsx",
    "components/checkout/steps/delivery-options.tsx",
    "components/checkout/steps/deposit-payment.tsx",
    "components/checkout/steps/drivers-license.tsx",
    "components/checkout/steps/payment-method.tsx",
    "components/checkout/steps/personal-details.tsx",
    "components/checkout/steps/protection-plans.tsx",
    "components/checkout/steps/review-order.tsx",
    "components/checkout/steps/trade-in.tsx",
    "components/contact-form.tsx",
    "components/delivery-tracker.tsx",
    "components/drivee-viewer.tsx",
    "components/error-boundary-ui.tsx",
    "components/finance-application-full-form.tsx",
    "components/finance-application/applicant-form.tsx",
    "components/finance-application/documents-step.tsx",
    "components/finance-application/postal-code-input.tsx",
    "components/finance-application/review-step.tsx",
    "components/finance-application/vehicle-financing-form.tsx",
    "components/footer-content.tsx",
    "components/footer-phone-link.tsx",
    "components/forms/DateSlotPicker.tsx",
    "components/forms/LiveVideoTourForm.tsx",
    "components/garage/garage-shell.tsx",
    "components/garage/transaction-history.tsx",
    "components/google-reviews-badge.tsx",
    "components/header.tsx",
    "components/hero-image-server.tsx",
    "components/homepage-below-fold.tsx",
    "components/homepage-content.tsx",
    "components/language-switcher.tsx",
    "components/lead-capture/lead-capture-form.tsx",
    "components/nav-button.tsx",
    "components/payment-calculator.tsx",
    "components/planet-motors-logo.tsx",
    "components/price-alert-modal.tsx",
    "components/protection-comparison-table.tsx",
    "components/rate-disclosure.tsx",
    "components/reserve-vehicle-modal.tsx",
    "components/schedule-test-drive.tsx",
    "components/search-autocomplete.tsx",
    "components/sell-your-car/benefits-section.tsx",
    "components/sell-your-car/comparison-table.tsx",
    "components/sell-your-car/cta-section.tsx",
    "components/sell-your-car/faq-section.tsx",
    "components/sell-your-car/hero.tsx",
    "components/sell-your-car/process-steps.tsx",
    "components/sell-your-car/testimonials-section.tsx",
    "components/seo/json-ld.tsx",
    "components/sign-in-panel.tsx",
    "components/similar-vehicles.tsx",
    "components/social-proof.tsx",
    "components/trade-in/ico-verification-dialog.tsx",
    "components/ui/address-autocomplete.tsx",
    "components/vehicle-badges.tsx",
    "components/vehicle-checkout.tsx",
    "components/vehicle-filters.tsx",
    "components/vehicle-grid.tsx",
    "components/vehicle-status-badge.tsx",
    "components/vehicle/LiveVideoTourSuccess.tsx",
    "components/vehicle/ScheduleLiveVideoTourModal.tsx",
    "components/vehicle/add-to-compare.tsx",
    "components/vehicle/price-drop-alert.tsx",
    "components/vehicle/price-negotiator.tsx",
    "components/virtualized-vehicle-grid.tsx",
    "contexts/auth-context.tsx",
    "contexts/compare-context.tsx",
    "contexts/favorites-context.tsx",
]

def fix_file(filepath):
    """
    Fix S6759: Wrap props type with Readonly<> in function component signatures.
    
    Patterns to fix:
    1. function Foo({ ... }: PropsType) -> function Foo({ ... }: Readonly<PropsType>)
    2. function Foo(props: PropsType) -> function Foo(props: Readonly<PropsType>)
    3. const Foo = ({ ... }: PropsType) -> const Foo = ({ ... }: Readonly<PropsType>)
    4. const Foo = (props: PropsType) -> const Foo = (props: Readonly<PropsType>)
    5. interface Props { ... } -> interface Props { readonly ... } (alternative)
    
    The simplest approach: wrap inline type annotations in function params with Readonly<>
    """
    if not os.path.exists(filepath):
        print(f"  SKIP (not found): {filepath}")
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    changes = 0
    
    # Pattern 1: ({ ... }: TypeName) or ({ ... }: TypeName & OtherType)
    # Match: }: SomeType) or }: SomeType & Other) but NOT }: Readonly<...>
    # We need to be careful not to double-wrap
    
    # Fix inline object destructuring with type annotation
    # Pattern: }: TypeIdentifier) where TypeIdentifier is not already Readonly<...>
    # Also handles }: TypeIdentifier, where there are more params
    
    def wrap_props_type(m):
        nonlocal changes
        prefix = m.group(1)  # }: 
        type_str = m.group(2)  # the type
        suffix = m.group(3)  # ) or ,
        
        # Skip if already Readonly
        if type_str.startswith('Readonly<'):
            return m.group(0)
        # Skip if it's a primitive or special type
        if type_str in ('void', 'never', 'unknown', 'any', 'string', 'number', 'boolean', 'null', 'undefined'):
            return m.group(0)
        # Skip if it's a generic that's not a props type (e.g., Array<...>, Promise<...>)
        # We only want to wrap named types that look like props interfaces
        
        changes += 1
        return f"{prefix}Readonly<{type_str}>{suffix}"
    
    # Pattern: }: TypeName) - destructured props with named type
    # Matches things like: }: ButtonProps) or }: ButtonProps & ExtraProps)
    content = re.sub(
        r'(\}:\s*)([A-Z][A-Za-z0-9]*(?:\s*&\s*[A-Z][A-Za-z0-9]*)*)([\),])',
        wrap_props_type,
        content
    )
    
    # Pattern: (props: TypeName) - named props param
    def wrap_named_props(m):
        nonlocal changes
        param = m.group(1)  # props or similar
        type_str = m.group(2)
        suffix = m.group(3)
        
        if type_str.startswith('Readonly<'):
            return m.group(0)
        if type_str in ('void', 'never', 'unknown', 'any', 'string', 'number', 'boolean', 'null', 'undefined'):
            return m.group(0)
        
        changes += 1
        return f"{param}Readonly<{type_str}>{suffix}"
    
    content = re.sub(
        r'(\b(?:props|p)\s*:\s*)([A-Z][A-Za-z0-9]*(?:\s*&\s*[A-Z][A-Za-z0-9]*)*)([\),])',
        wrap_named_props,
        content
    )
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  FIXED ({changes} changes): {filepath}")
        return True
    else:
        print(f"  NO CHANGE: {filepath}")
        return False

def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    fixed = 0
    skipped = 0
    
    for f in FILES:
        full_path = os.path.join(base, f)
        if fix_file(full_path):
            fixed += 1
        else:
            skipped += 1
    
    print(f"\nDone: {fixed} files fixed, {skipped} skipped")

if __name__ == '__main__':
    main()
