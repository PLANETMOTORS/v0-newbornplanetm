-- Supabase Postgres Trigger for Typesense Inventory Sync
-- This trigger automatically upserts inventory changes to Typesense

-- Create the function that will call our edge function
CREATE OR REPLACE FUNCTION sync_vehicle_to_typesense()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
BEGIN
  -- Build payload based on operation type
  IF TG_OP = 'DELETE' THEN
    payload = jsonb_build_object(
      'operation', 'delete',
      'vehicle_id', OLD.id
    );
  ELSE
    payload = jsonb_build_object(
      'operation', CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
      'vehicle', jsonb_build_object(
        'id', NEW.id,
        'vin', NEW.vin,
        'make', NEW.make,
        'model', NEW.model,
        'year', NEW.year,
        'price', NEW.price,
        'mileage', NEW.mileage,
        'exterior_color', NEW.exterior_color,
        'interior_color', NEW.interior_color,
        'fuel_type', NEW.fuel_type,
        'transmission', NEW.transmission,
        'drivetrain', NEW.drivetrain,
        'body_type', NEW.body_type,
        'engine', NEW.engine,
        'features', NEW.features,
        'images', NEW.images,
        'status', NEW.status,
        'condition', NEW.condition,
        'certified', NEW.certified,
        'ev_range', NEW.ev_range,
        'battery_health', NEW.battery_health,
        'location', NEW.location,
        'created_at', NEW.created_at,
        'updated_at', NEW.updated_at
      )
    );
  END IF;

  -- Call the edge function to sync with Typesense
  PERFORM net.http_post(
    url := current_setting('app.typesense_sync_url', true),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.typesense_sync_key', true)
    ),
    body := payload
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the vehicles table
DROP TRIGGER IF EXISTS vehicle_typesense_sync ON vehicles;

CREATE TRIGGER vehicle_typesense_sync
  AFTER INSERT OR UPDATE OR DELETE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION sync_vehicle_to_typesense();

-- Add comment for documentation
COMMENT ON FUNCTION sync_vehicle_to_typesense() IS 
  'Automatically syncs vehicle inventory changes to Typesense for sub-50ms search';

COMMENT ON TRIGGER vehicle_typesense_sync ON vehicles IS 
  'Triggers Typesense upsert on any vehicle table changes';
