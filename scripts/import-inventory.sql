-- Planet Motors Inventory Import
-- Generated: 2026-03-30
-- Rule: Always wipe previous inventory and replace with new data

-- Step 1: Delete ALL existing inventory
DELETE FROM public.vehicles;

-- Step 2: Insert new inventory from HomeNet CSV (36 vehicles)
INSERT INTO public.vehicles (
  stock_number, vin, year, make, model, trim, exterior_color, interior_color,
  transmission, price, mileage, fuel_type, is_ev, is_certified, status, location,
  primary_image_url
) VALUES
-- 1. 2018 Audi Q3 Technik
('PM91393926', 'WA1GCCFS9JR009139', 2018, 'Audi', 'Q3', 'Technik', 'Glacier White Metallic', 'Chestnut Brown', 'Automatic', 1925000, 82950, 'Gasoline', FALSE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2018-audi-q3-13133426/13133426/'),

-- 2. 2025 Chevrolet Equinox EV RS
('PE77034007', '3GN7DSRR5SS127703', 2025, 'Chevrolet', 'Equinox EV', 'RS', 'Iridescent Pearl Tricoat', 'Adrenaline Red', 'Automatic', 4420000, 12775, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2025-chevrolet-equinox-ev-13594670/13594670/'),

-- 3. 2025 Hyundai Kona Electric Preferred
('PE31383991', 'KM8HC3A62SU023138', 2025, 'Hyundai', 'Kona Electric', 'Preferred', 'Cyber Grey', 'Black', 'Automatic', 3635000, 15750, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2025-hyundai-kona-13539194/13539194/'),

-- 4. 2021 Jeep Wrangler 4xe Unlimited Sahara (Granite)
('PM73824033', '1C4JJXP60MW777382', 2021, 'Jeep', 'Wrangler 4xe', 'Unlimited Sahara', 'Granite Crystal Metallic', 'Black', 'Automatic', 3650000, 48500, 'Hybrid', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2021-jeep-wrangler-4xe-13737584/13737584/'),

-- 5. 2021 Jeep Wrangler 4xe Unlimited Sahara (Red)
('PE40417356', '1C4JJXP6XMW777356', 2021, 'Jeep', 'Wrangler 4xe', 'Unlimited Sahara', 'Firecracker Red', 'Black', 'Automatic', 3850000, 37355, 'Hybrid', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2021-jeep-wrangler-4xe-13793298/13793298/'),

-- 6. 2022 Kia Soul EV Limited
('PE59404003', 'KNDJ33A12N7025940', 2022, 'Kia', 'Soul EV', 'EV Limited', 'Neptune Blue', 'Black', 'Automatic', 2235000, 35950, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2022-kia-soul-13590317/13590317/'),

-- 7. 2024 Tesla Model 3 (Pearl White)
('PE39513961', 'LRW3E7FAXRC093951', 2024, 'Tesla', 'Model 3', NULL, 'Pearl White Multi-Coat', 'Black', 'Automatic', 3795000, 70500, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2024-tesla-model-3-13470853/13470853/'),

-- 8. 2024 Tesla Model 3 (Stealth Grey)
('PE92904020', 'LRW3E7FA5RC089290', 2024, 'Tesla', 'Model 3', NULL, 'Stealth Grey', 'Black', 'Automatic', 4350000, 15750, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2024-tesla-model-3-13695740/13695740/'),

-- 9. 2023 Tesla Model 3 Long Range (Pearl White)
('PE63674006', 'LRW3E1EBXPC876367', 2023, 'Tesla', 'Model 3', 'Long Range', 'Pearl White Multi-Coat', 'Black', 'Automatic', 3637500, 58500, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2023-tesla-model-3-13590743/13590743/'),

-- 10. 2023 Tesla Model 3 Long Range (Deep Blue)
('PE31164035', 'LRW3E1EB3PC943116', 2023, 'Tesla', 'Model 3', 'Long Range', 'Deep Blue Metallic', 'Black', 'Automatic', 3395000, 83500, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2023-tesla-model-3-13737905/13737905/'),

-- 11. 2024 Tesla Model 3 Long Range (Stealth Grey)
('PE404432901', 'LRW3E7EB6RC102901', 2024, 'Tesla', 'Model 3', 'Long Range', 'Stealth Grey', 'Black', 'Automatic', 4650000, 56850, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2024-tesla-model-3-13793304/13793304/'),

-- 12. 2022 Tesla Model 3 Performance (Red)
('PE45403977', '5YJ3E1EC5NF234540', 2022, 'Tesla', 'Model 3', 'Performance', 'Red Multi-Coat', 'Black', 'Automatic', 3930000, 38525, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2022-tesla-model-3-13501295/13501295/'),

-- 13. 2022 Tesla Model 3 Performance (Pearl White)
('PE30784010', '5YJ3E1EC6NF183078', 2022, 'Tesla', 'Model 3', 'Performance', 'Pearl White Multi-Coat', 'Black', 'Automatic', 3390000, 91850, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2022-tesla-model-3-13609091/13609091/'),

-- 14. 2025 Tesla Model 3 Premium (Deep Blue)
('PE42524021', '5YJ3E1EB8SF894252', 2025, 'Tesla', 'Model 3', 'Premium', 'Deep Blue Metallic', 'Black', 'Automatic', 4950000, 57850, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2025-tesla-model-3-13695731/13695731/'),

-- 15. 2025 Tesla Model 3 Premium (Stealth Grey)
('PE26464022', '5YJ3E1EB6SF922646', 2025, 'Tesla', 'Model 3', 'Premium', 'Stealth Grey', 'Black', 'Automatic', 5390000, 45895, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2025-tesla-model-3-13705661/13705661/'),

-- 16. 2020 Tesla Model 3 Standard Range Plus (Deep Blue)
('PE26193923', '5YJ3E1EA4LF642619', 2020, 'Tesla', 'Model 3', 'Standard Range Plus', 'Deep Blue Metallic', 'Black', 'Automatic', 2125000, 102500, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2020-tesla-model-3-13133429/13133429/'),

-- 17. 2019 Tesla Model 3 Standard Range Plus (Black)
('PM13823944', '5YJ3E1EA7KF321382', 2019, 'Tesla', 'Model 3', 'Standard Range Plus', 'Solid Black', 'Black', 'Automatic', 1987500, 101850, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2019-tesla-model-3-13204466/13204466/'),

-- 18. 2021 Tesla Model 3 Standard Range Plus (Silver)
('PE87123965', '5YJ3E1EA3MF848712', 2021, 'Tesla', 'Model 3', 'Standard Range Plus', 'Midnight Silver Metallic', 'Black', 'Automatic', 2555000, 60775, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2021-tesla-model-3-13437837/13437837/'),

-- 19. 2021 Tesla Model 3 Standard Range Plus (Deep Blue)
('PE39393963', '5YJ3E1EA9MF973939', 2021, 'Tesla', 'Model 3', 'Standard Range Plus', 'Deep Blue Metallic', 'Black', 'Automatic', 2560000, 60959, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2021-tesla-model-3-13466886/13466886/'),

-- 20. 2020 Tesla Model 3 Standard Range Plus (Black, High Mileage)
('PE23414013', '5YJ3E1EA7LF642341', 2020, 'Tesla', 'Model 3', 'Standard Range Plus', 'Solid Black', 'Black', 'Automatic', 1800000, 147500, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2020-tesla-model-3-13612685/13612685/'),

-- 21. 2022 Tesla Model S Plaid
('PE64774011', '5YJSA1E64NF476477', 2022, 'Tesla', 'Model S', 'Plaid', 'Midnight Silver Metallic', 'Black', 'Automatic', 8995000, 35950, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2022-tesla-model-s-13607230/13607230/'),

-- 22. 2024 Tesla Model Y (Stealth Grey)
('PE04453953', 'LRWYGDFD2RC640445', 2024, 'Tesla', 'Model Y', NULL, 'Stealth Grey', 'White/Black', 'Automatic', 4150000, 28575, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2024-tesla-model-y-13287755/13287755/'),

-- 23. 2022 Tesla Model Y Long Range (Pearl White, High Mileage)
('PE15803948', '7SAYGDEE3NF371580', 2022, 'Tesla', 'Model Y', 'Long Range', 'Pearl White Multi-Coat', 'Black', 'Automatic', 3389500, 108685, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2022-tesla-model-y-13287776/13287776/'),

-- 24. 2023 Tesla Model Y Long Range (Black)
('PE18464017', '7SAYGDEE6PF771846', 2023, 'Tesla', 'Model Y', 'Long Range', 'Solid Black', 'White/Black', 'Automatic', 4690000, 44985, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2023-tesla-model-y-13695743/13695743/'),

-- 25. 2024 Tesla Model Y Long Range (Black)
('PE30884025', '7SAYGDEE1RF053088', 2024, 'Tesla', 'Model Y', 'Long Range', 'Solid Black', 'White/Black', 'Automatic', 5125000, 39895, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2024-tesla-model-y-13705658/13705658/'),

-- 26. 2023 Tesla Model Y Long Range (Silver)
('PE03774030', '7SAYGDEE9PF600377', 2023, 'Tesla', 'Model Y', 'Long Range', 'Midnight Silver Metallic', 'Black', 'Automatic', 4650000, 47725, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2023-tesla-model-y-13737590/13737590/'),

-- 27. 2022 Tesla Model Y Long Range (Deep Blue)
('PE40381838', '7SAYGAEE2NF381838', 2022, 'Tesla', 'Model Y', 'Long Range', 'Deep Blue Metallic', 'White/Black', 'Automatic', 4150000, 75575, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2022-tesla-model-y-13793256/13793256/'),

-- 28. 2022 Tesla Model Y Long Range (Black)
('PE40396655', '7SAYGDEE0NF376655', 2022, 'Tesla', 'Model Y', 'Long Range', 'Solid Black', 'Black', 'Automatic', 3990000, 69895, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2022-tesla-model-y-13793259/13793259/'),

-- 29. 2022 Tesla Model Y Long Range (Deep Blue, High Mileage)
('PE40403551', '7SAYGAEE0NF323551', 2022, 'Tesla', 'Model Y', 'Long Range', 'Deep Blue Metallic', 'Black', 'Automatic', 3950000, 95895, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2022-tesla-model-y-13793262/13793262/'),

-- 30. 2022 Tesla Model Y Long Range (Black)
('PE40427385', '7SAYGAEE4NF377385', 2022, 'Tesla', 'Model Y', 'Long Range', 'Solid Black', 'Black', 'Automatic', 3950000, 89850, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2022-tesla-model-y-13793301/13793301/'),

-- 31. 2022 Tesla Model Y Performance (Black)
('PE87524015', '7SAYGDEF9NF308752', 2022, 'Tesla', 'Model Y', 'Performance', 'Solid Black', 'Black', 'Automatic', 4450000, 37950, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2022-tesla-model-y-13695737/13695737/'),

-- 32. 2022 Tesla Model Y Performance (Pearl White)
('PE40364938', '7SAYGDEF1NF374938', 2022, 'Tesla', 'Model Y', 'Performance', 'Pearl White Multi-Coat', 'White/Black', 'Automatic', 4450000, 52985, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2022-tesla-model-y-13793250/13793250/'),

-- 33. 2022 Tesla Model Y Performance (Pearl White)
('PE40377909', '7SAYGDEF7NF337909', 2022, 'Tesla', 'Model Y', 'Performance', 'Pearl White Multi-Coat', 'White/Black', 'Automatic', 4395000, 54100, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2022-tesla-model-y-13793253/13793253/'),

-- 34. 2021 Tesla Model Y Standard Range (Pearl White)
('PE11363994', '5YJYGDED2MF121136', 2021, 'Tesla', 'Model Y', 'Standard Range', 'Pearl White Multi-Coat', 'White/Black', 'Automatic', 3050000, 72850, 'Electric', TRUE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2021-tesla-model-y-13560197/13560197/'),

-- 35. 2023 Volkswagen Taos Highline
('PM11883997', '3VV4X7B24PM371188', 2023, 'Volkswagen', 'Taos', 'Highline', 'Cornflower Blue', 'French Roast/Titan Black', 'Automatic', 2597000, 63600, 'Gasoline', FALSE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2023-volkswagen-taos-13566533/13566533/'),

-- 36. 2018 Volkswagen Tiguan Comfortline
('PM87233979', '3VV2B7AX2JM008723', 2018, 'Volkswagen', 'Tiguan', 'Comfortline', 'Platinum Gray Metallic', 'Titan Black/Golden Oak', 'Automatic', 1790000, 87895, 'Gasoline', FALSE, TRUE, 'available', 'Richmond Hill, ON', 'https://www.planetmotors.ca/inventory/2018-volkswagen-tiguan-13501298/13501298/');

-- Verify import
SELECT 
  COUNT(*) as total_vehicles,
  COUNT(*) FILTER (WHERE is_ev = TRUE) as ev_vehicles,
  COUNT(*) FILTER (WHERE make = 'Tesla') as tesla_count,
  MIN(price/100) as min_price,
  MAX(price/100) as max_price
FROM public.vehicles;
