-- 007_seed_outlets_and_test_data.sql
-- Seed 15 real outlets, services, stylists, schedules, and test customers
-- Agent: CHESKY (Orchestrator)

-- ============================================================
-- OUTLETS (15 total: 7 EX Style, 4 EX Beauty, 3 UHair, 1 Coulisse)
-- All outlets in Singapore
-- ============================================================

-- EX Style outlets (hair salon) — 7 outlets
INSERT INTO outlets (brand_id, name, address, city, country, lat, lng, phone, operating_hours) VALUES
  ((SELECT id FROM brands WHERE code = 'ex_style'), 'EX Style PLQ Mall', '10 Paya Lebar Road, #04-18/19 Paya Lebar Quarter, PLQ Mall, Singapore 409057', 'Singapore', 'SG', 1.3176, 103.8932, NULL, '{"mon":{"open":"10:30","close":"21:00"},"tue":{"open":"10:30","close":"21:00"},"wed":{"open":"10:30","close":"21:00"},"thu":{"open":"10:30","close":"21:00"},"fri":{"open":"10:30","close":"21:00"},"sat":{"open":"10:00","close":"20:30"},"sun":{"open":"10:00","close":"20:30"}}'),
  ((SELECT id FROM brands WHERE code = 'ex_style'), 'EX Style Vivo City', '1 HarbourFront Walk, #B1-15 Vivo City, Singapore 098585', 'Singapore', 'SG', 1.2644, 103.8222, NULL, '{"mon":{"open":"10:30","close":"21:00"},"tue":{"open":"10:30","close":"21:00"},"wed":{"open":"10:30","close":"21:00"},"thu":{"open":"10:30","close":"21:00"},"fri":{"open":"10:30","close":"21:00"},"sat":{"open":"10:00","close":"20:30"},"sun":{"open":"10:00","close":"20:30"}}'),
  ((SELECT id FROM brands WHERE code = 'ex_style'), 'EX Style Jurong Point', '1 Jurong West Central 2, #02-35/36 Jurong Point Shopping Center 1, Singapore 648886', 'Singapore', 'SG', 1.3397, 103.7066, NULL, '{"mon":{"open":"10:30","close":"21:00"},"tue":{"open":"10:30","close":"21:00"},"wed":{"open":"10:30","close":"21:00"},"thu":{"open":"10:30","close":"21:00"},"fri":{"open":"10:30","close":"21:00"},"sat":{"open":"10:00","close":"20:30"},"sun":{"open":"10:00","close":"20:30"}}'),
  ((SELECT id FROM brands WHERE code = 'ex_style'), 'EX Style Century Square', '2 Tampines Central 5, #03-29 Century Square, Singapore 529509', 'Singapore', 'SG', 1.3525, 103.9445, NULL, '{"mon":{"open":"10:30","close":"21:00"},"tue":{"open":"10:30","close":"21:00"},"wed":{"open":"10:30","close":"21:00"},"thu":{"open":"10:30","close":"21:00"},"fri":{"open":"10:30","close":"21:00"},"sat":{"open":"10:00","close":"20:30"},"sun":{"open":"10:00","close":"20:30"}}'),
  ((SELECT id FROM brands WHERE code = 'ex_style'), 'EX Style Northpoint City', '930 Yishun Ave 2, #03-01 Northpoint City (North Wing), Singapore 768019', 'Singapore', 'SG', 1.4295, 103.8360, NULL, '{"mon":{"open":"10:30","close":"21:00"},"tue":{"open":"10:30","close":"21:00"},"wed":{"open":"10:30","close":"21:00"},"thu":{"open":"10:30","close":"21:00"},"fri":{"open":"10:30","close":"21:00"},"sat":{"open":"10:00","close":"20:30"},"sun":{"open":"10:00","close":"20:30"}}'),
  ((SELECT id FROM brands WHERE code = 'ex_style'), 'EX Style Heartland Mall', '205 Hougang Street 21, Heartland Mall, Level 2, Singapore 530205', 'Singapore', 'SG', 1.3594, 103.8863, NULL, '{"mon":{"open":"10:30","close":"21:00"},"tue":{"open":"10:30","close":"21:00"},"wed":{"open":"10:30","close":"21:00"},"thu":{"open":"10:30","close":"21:00"},"fri":{"open":"10:30","close":"21:00"},"sat":{"open":"10:00","close":"20:30"},"sun":{"open":"10:00","close":"20:30"}}'),
  ((SELECT id FROM brands WHERE code = 'ex_style'), 'EX Style Woodleigh Mall', '11 Bidadari Park Drive, #02-43/44 Woodleigh Mall, Singapore 367803', 'Singapore', 'SG', 1.3374, 103.8707, NULL, '{"mon":{"open":"10:30","close":"21:00"},"tue":{"open":"10:30","close":"21:00"},"wed":{"open":"10:30","close":"21:00"},"thu":{"open":"10:30","close":"21:00"},"fri":{"open":"10:30","close":"21:00"},"sat":{"open":"10:00","close":"20:30"},"sun":{"open":"10:00","close":"20:30"}}');

-- EX Beauty outlets (beauty) — 4 outlets
INSERT INTO outlets (brand_id, name, address, city, country, lat, lng, phone, operating_hours) VALUES
  ((SELECT id FROM brands WHERE code = 'ex_beauty'), 'EX Beauty Century Square', '2 Tampines Central 5, #03-04, Singapore 529509', 'Singapore', 'SG', 1.3525, 103.9445, '+6562607188', '{"mon":{"open":"11:00","close":"21:00"},"tue":{"open":"11:00","close":"21:00"},"wed":{"open":"11:00","close":"21:00"},"thu":{"open":"11:00","close":"21:00"},"fri":{"open":"11:00","close":"21:00"},"sat":{"open":"10:00","close":"19:00"},"sun":{"open":"10:00","close":"19:00"}}'),
  ((SELECT id FROM brands WHERE code = 'ex_beauty'), 'EX Beauty Northpoint City', '930 Yishun Avenue 2, #B1-35 North Wing North Point, Singapore 769098', 'Singapore', 'SG', 1.4295, 103.8360, '+6565567188', '{"mon":{"open":"11:00","close":"21:00"},"tue":{"open":"11:00","close":"21:00"},"wed":{"open":"11:00","close":"21:00"},"thu":{"open":"11:00","close":"21:00"},"fri":{"open":"11:00","close":"21:00"},"sat":{"open":"10:00","close":"19:00"},"sun":{"open":"10:00","close":"19:00"}}'),
  ((SELECT id FROM brands WHERE code = 'ex_beauty'), 'EX Beauty Jurong West', '494 Jurong West Street 41, #01-134, Singapore 640494', 'Singapore', 'SG', 1.3494, 103.7190, '+6565678717', '{"mon":{"open":"11:00","close":"21:00"},"tue":{"open":"11:00","close":"21:00"},"wed":{"open":"11:00","close":"21:00"},"thu":{"open":"11:00","close":"21:00"},"fri":{"open":"11:00","close":"21:00"},"sat":{"open":"10:00","close":"19:00"},"sun":{"open":"10:00","close":"19:00"}}'),
  ((SELECT id FROM brands WHERE code = 'ex_beauty'), 'EX Beauty Tiong Bahru', '302 Tiong Bahru Rd, #03-107, Plaza, Singapore 168732', 'Singapore', 'SG', 1.2863, 103.8310, NULL, '{"mon":{"open":"11:00","close":"21:00"},"tue":{"open":"11:00","close":"21:00"},"wed":{"open":"11:00","close":"21:00"},"thu":{"open":"11:00","close":"21:00"},"fri":{"open":"11:00","close":"21:00"},"sat":{"open":"10:00","close":"19:00"},"sun":{"open":"10:00","close":"19:00"}}');

-- UHair outlets (hair salon) — 3 outlets
INSERT INTO outlets (brand_id, name, address, city, country, lat, lng, phone, operating_hours) VALUES
  ((SELECT id FROM brands WHERE code = 'uhair'), 'UHair Jurong Point', '1 Jurong West Central 2, #02-20F, Singapore 648886', 'Singapore', 'SG', 1.3397, 103.7066, '+6590885305', '{"mon":{"open":"10:30","close":"21:00"},"tue":{"open":"10:30","close":"21:00"},"wed":{"open":"10:30","close":"21:00"},"thu":{"open":"10:30","close":"21:00"},"fri":{"open":"10:30","close":"21:00"},"sat":{"open":"10:00","close":"20:30"},"sun":{"open":"10:00","close":"20:30"}}'),
  ((SELECT id FROM brands WHERE code = 'uhair'), 'UHair Pasir Ris Mall', '7 Pasir Ris Central, #B1-16, Singapore 519612', 'Singapore', 'SG', 1.3730, 103.9494, '+6590885305', '{"mon":{"open":"10:30","close":"21:00"},"tue":{"open":"10:30","close":"21:00"},"wed":{"open":"10:30","close":"21:00"},"thu":{"open":"10:30","close":"21:00"},"fri":{"open":"10:30","close":"21:00"},"sat":{"open":"10:00","close":"20:30"},"sun":{"open":"10:00","close":"20:30"}}'),
  ((SELECT id FROM brands WHERE code = 'uhair'), 'UHair Junction 8', '9 Bishan Place, #02-31, Singapore 579837', 'Singapore', 'SG', 1.3505, 103.8487, '+6590885305', '{"mon":{"open":"10:30","close":"21:00"},"tue":{"open":"10:30","close":"21:00"},"wed":{"open":"10:30","close":"21:00"},"thu":{"open":"10:30","close":"21:00"},"fri":{"open":"10:30","close":"21:00"},"sat":{"open":"10:00","close":"20:30"},"sun":{"open":"10:00","close":"20:30"}}');

-- Coulisse outlet (scalp specialist) — 1 outlet
INSERT INTO outlets (brand_id, name, address, city, country, lat, lng, phone, operating_hours) VALUES
  ((SELECT id FROM brands WHERE code = 'coulisse'), 'Coulisse ION Orchard', '2 Orchard Turn, ION Orchard, Singapore 238801', 'Singapore', 'SG', 1.3040, 103.8318, NULL, '{"mon":{"open":"10:00","close":"22:00"},"tue":{"open":"10:00","close":"22:00"},"wed":{"open":"10:00","close":"22:00"},"thu":{"open":"10:00","close":"22:00"},"fri":{"open":"10:00","close":"22:00"},"sat":{"open":"10:00","close":"22:00"},"sun":{"open":"10:00","close":"22:00"}}');

-- ============================================================
-- SERVICES (all SGD since all outlets are in Singapore)
-- ============================================================

-- EX Style services (hair salon)
INSERT INTO services (brand_id, name, description, duration_minutes, buffer_minutes, price_cents, currency, category) VALUES
  ((SELECT id FROM brands WHERE code = 'ex_style'), 'Haircut & Styling', 'Precision cut with wash and style', 60, 15, 5800, 'SGD', 'cut'),
  ((SELECT id FROM brands WHERE code = 'ex_style'), 'Hair Coloring', 'Full color application with premium dye', 120, 15, 15800, 'SGD', 'color'),
  ((SELECT id FROM brands WHERE code = 'ex_style'), 'Highlights / Balayage', 'Partial or full highlights', 150, 15, 22800, 'SGD', 'color'),
  ((SELECT id FROM brands WHERE code = 'ex_style'), 'Keratin Treatment', 'Smoothing treatment for frizz-free hair', 120, 15, 28800, 'SGD', 'treatment'),
  ((SELECT id FROM brands WHERE code = 'ex_style'), 'Hair Wash & Blow Dry', 'Wash, condition, and blow dry', 30, 10, 2500, 'SGD', 'wash'),
  ((SELECT id FROM brands WHERE code = 'ex_style'), 'Scalp Treatment', 'Deep cleanse scalp therapy', 45, 10, 8800, 'SGD', 'treatment');

-- EX Beauty services (beauty)
INSERT INTO services (brand_id, name, description, duration_minutes, buffer_minutes, price_cents, currency, category) VALUES
  ((SELECT id FROM brands WHERE code = 'ex_beauty'), 'Rejuvenation Treatment', 'Skin rejuvenation facial treatment', 60, 15, 12800, 'SGD', 'facial'),
  ((SELECT id FROM brands WHERE code = 'ex_beauty'), 'Retargeting Treatment', 'Targeted skin concern treatment', 75, 15, 18800, 'SGD', 'facial'),
  ((SELECT id FROM brands WHERE code = 'ex_beauty'), 'Renewal Treatment', 'Deep renewal and hydration therapy', 90, 15, 22800, 'SGD', 'facial'),
  ((SELECT id FROM brands WHERE code = 'ex_beauty'), 'Body Treatment', 'Full body treatment and contouring', 90, 15, 25800, 'SGD', 'body'),
  ((SELECT id FROM brands WHERE code = 'ex_beauty'), 'Eye Treatment', 'Targeted eye area treatment', 30, 10, 8800, 'SGD', 'facial'),
  ((SELECT id FROM brands WHERE code = 'ex_beauty'), 'Consultation', 'Skin analysis and consultation', 30, 10, 0, 'SGD', 'consultation');

-- UHair services (hair salon)
INSERT INTO services (brand_id, name, description, duration_minutes, buffer_minutes, price_cents, currency, category) VALUES
  ((SELECT id FROM brands WHERE code = 'uhair'), 'Men''s Haircut', 'Precision men''s cut with styling', 45, 10, 3800, 'SGD', 'cut'),
  ((SELECT id FROM brands WHERE code = 'uhair'), 'Women''s Haircut', 'Women''s cut with wash and blow dry', 60, 15, 4800, 'SGD', 'cut'),
  ((SELECT id FROM brands WHERE code = 'uhair'), 'Hair Coloring', 'Full color with consultation', 120, 15, 12800, 'SGD', 'color'),
  ((SELECT id FROM brands WHERE code = 'uhair'), 'Digital Perm', 'Korean-style digital perm', 180, 15, 22800, 'SGD', 'perm'),
  ((SELECT id FROM brands WHERE code = 'uhair'), 'Hair Treatment', 'Repair and nourish treatment', 60, 10, 9800, 'SGD', 'treatment'),
  ((SELECT id FROM brands WHERE code = 'uhair'), 'Wash & Blow', 'Quick wash and blow dry', 30, 10, 1800, 'SGD', 'wash');

-- Coulisse services (scalp specialist)
INSERT INTO services (brand_id, name, description, duration_minutes, buffer_minutes, price_cents, currency, category) VALUES
  ((SELECT id FROM brands WHERE code = 'coulisse'), 'Scalp Analysis', 'Comprehensive scalp health check with microscope', 30, 10, 5800, 'SGD', 'analysis'),
  ((SELECT id FROM brands WHERE code = 'coulisse'), 'Anti Hair Loss Treatment', 'Targeted treatment for thinning hair', 60, 15, 18800, 'SGD', 'treatment'),
  ((SELECT id FROM brands WHERE code = 'coulisse'), 'Scalp Detox', 'Deep cleanse and exfoliation', 45, 10, 12800, 'SGD', 'treatment'),
  ((SELECT id FROM brands WHERE code = 'coulisse'), 'Hair Growth Program', '90-day intensive regrowth package session', 90, 15, 32800, 'SGD', 'treatment'),
  ((SELECT id FROM brands WHERE code = 'coulisse'), 'Dandruff Control', 'Anti-dandruff therapy session', 45, 10, 9800, 'SGD', 'treatment');

-- ============================================================
-- STYLISTS (3 per outlet = 45 total)
-- ============================================================

INSERT INTO stylists (outlet_id, name, specialties, bio)
SELECT o.id, s.name, s.specialties::text[], s.bio
FROM outlets o
CROSS JOIN (VALUES
  ('Senior Stylist', '{cut,color,treatment}', 'Senior stylist with 8+ years experience'),
  ('Stylist', '{cut,wash,treatment}', 'Creative stylist specializing in modern trends'),
  ('Junior Stylist', '{cut,wash}', 'Enthusiastic junior stylist with fresh perspective')
) AS s(name, specialties, bio);

-- Make stylist names unique per outlet
UPDATE stylists SET name = name || ' ' || substring(id::text, 1, 4);

-- ============================================================
-- STYLIST SCHEDULES (Mon-Sat for all stylists)
-- ============================================================

INSERT INTO stylist_schedules (stylist_id, day_of_week, start_time, end_time, is_available)
SELECT s.id, d.day, '10:00'::time, '19:00'::time, true
FROM stylists s
CROSS JOIN (VALUES (1),(2),(3),(4),(5),(6)) AS d(day);

-- ============================================================
-- TEST CUSTOMERS (50 customers, all SG phone numbers)
-- ============================================================

INSERT INTO customers (phone, email, display_name, preferred_language, marketing_consent) VALUES
  ('+6591110001', 'sarah.tan@test.com', 'Sarah Tan', 'en', true),
  ('+6591110002', 'wei.ling@test.com', 'Wei Ling', 'zh', true),
  ('+6591110003', 'aisha.m@test.com', 'Aisha Mohamed', 'ms', true),
  ('+6591110004', 'jessica.wong@test.com', 'Jessica Wong', 'en', true),
  ('+6591110005', 'nurul.h@test.com', 'Nurul Huda', 'ms', false),
  ('+6591110006', 'mei.chen@test.com', 'Mei Chen', 'zh', true),
  ('+6591110007', 'priya.r@test.com', 'Priya Ramesh', 'en', true),
  ('+6591110008', 'siti.n@test.com', 'Siti Nurhaliza', 'ms', true),
  ('+6591110009', 'amanda.lee@test.com', 'Amanda Lee', 'en', false),
  ('+6591110010', 'farah.z@test.com', 'Farah Zainal', 'ms', true),
  ('+6591110011', 'jenny.lim@test.com', 'Jenny Lim', 'en', true),
  ('+6591110012', 'kavitha.s@test.com', 'Kavitha Suresh', 'en', true),
  ('+6591110013', 'yi.xuan@test.com', 'Yi Xuan', 'zh', false),
  ('+6591110014', 'nina.a@test.com', 'Nina Ahmad', 'ms', true),
  ('+6591110015', 'rachel.ng@test.com', 'Rachel Ng', 'en', true),
  ('+6591110016', 'hanis.i@test.com', 'Hanis Ibrahim', 'ms', true),
  ('+6591110017', 'crystal.k@test.com', 'Crystal Koh', 'en', true),
  ('+6591110018', 'aina.r@test.com', 'Aina Rosli', 'ms', false),
  ('+6591110019', 'sophie.c@test.com', 'Sophie Chong', 'en', true),
  ('+6591110020', 'nadia.h@test.com', 'Nadia Hassan', 'ms', true),
  ('+6591110021', 'michelle.t@test.com', 'Michelle Teo', 'en', true),
  ('+6591110022', 'hui.min@test.com', 'Hui Min', 'zh', true),
  ('+6591110023', 'sarah.l@test.com', 'Sarah Lim', 'en', true),
  ('+6591110024', 'yuki.t@test.com', 'Yuki Tanaka', 'en', false),
  ('+6591110025', 'rina.s@test.com', 'Rina Sato', 'en', true),
  ('+6591110026', 'david.t@test.com', 'David Tan', 'en', true),
  ('+6591110027', 'marcus.w@test.com', 'Marcus Wong', 'en', true),
  ('+6591110028', 'ahmad.f@test.com', 'Ahmad Faiz', 'ms', true),
  ('+6591110029', 'jason.l@test.com', 'Jason Lee', 'en', false),
  ('+6591110030', 'ryan.c@test.com', 'Ryan Chen', 'zh', true),
  ('+6591110031', 'daniel.o@test.com', 'Daniel Ong', 'en', true),
  ('+6591110032', 'hafiz.m@test.com', 'Hafiz Malik', 'ms', true),
  ('+6591110033', 'kevin.y@test.com', 'Kevin Yap', 'en', true),
  ('+6591110034', 'imran.k@test.com', 'Imran Khan', 'ms', false),
  ('+6591110035', 'alex.t@test.com', 'Alex Tham', 'en', true),
  ('+6591110036', 'ben.k@test.com', 'Ben Koh', 'en', true),
  ('+6591110037', 'chris.n@test.com', 'Chris Ng', 'en', true),
  ('+6591110038', 'derek.l@test.com', 'Derek Loh', 'en', true),
  ('+6591110039', 'ethan.w@test.com', 'Ethan Wee', 'en', false),
  ('+6591110040', 'frank.g@test.com', 'Frank Goh', 'en', true),
  ('+6591110041', 'lisa.p@test.com', 'Lisa Pang', 'en', true),
  ('+6591110042', 'maya.d@test.com', 'Maya Devi', 'en', true),
  ('+6591110043', 'zara.a@test.com', 'Zara Ali', 'ms', true),
  ('+6591110044', 'bella.c@test.com', 'Bella Chang', 'zh', true),
  ('+6591110045', 'diana.r@test.com', 'Diana Rahim', 'ms', false),
  ('+6591110046', 'grace.t@test.com', 'Grace Tan', 'en', true),
  ('+6591110047', 'hannah.l@test.com', 'Hannah Low', 'en', true),
  ('+6591110048', 'ivy.c@test.com', 'Ivy Chua', 'en', true),
  ('+6591110049', 'jade.o@test.com', 'Jade Ong', 'en', true),
  ('+6591110050', 'kim.w@test.com', 'Kim Wong', 'zh', true);

-- ============================================================
-- BRAND MEMBERSHIPS (distribute customers across brands)
-- ============================================================

-- Customers 1-15 → EX Style (various tiers)
INSERT INTO customer_brand_memberships (customer_id, brand_id, membership_tier, total_points, total_visits)
SELECT c.id, (SELECT id FROM brands WHERE code = 'ex_style'), t.tier, t.points, t.visits
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM customers) c
JOIN (VALUES
  (1, 'platinum', 6200, 45), (2, 'gold', 2100, 22), (3, 'gold', 1800, 18),
  (4, 'silver', 900, 12), (5, 'silver', 650, 8), (6, 'bronze', 350, 4),
  (7, 'bronze', 200, 3), (8, 'bronze', 100, 2), (9, 'bronze', 50, 1),
  (10, 'bronze', 0, 0), (11, 'platinum', 5500, 40), (12, 'gold', 1700, 16),
  (13, 'silver', 800, 10), (14, 'bronze', 150, 2), (15, 'bronze', 0, 0)
) AS t(rn, tier, points, visits) ON c.rn = t.rn;

-- Customers 5-25 → EX Beauty
INSERT INTO customer_brand_memberships (customer_id, brand_id, membership_tier, total_points, total_visits)
SELECT c.id, (SELECT id FROM brands WHERE code = 'ex_beauty'), t.tier, t.points, t.visits
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM customers) c
JOIN (VALUES
  (5, 'gold', 2000, 20), (6, 'silver', 700, 9), (7, 'silver', 600, 7),
  (8, 'bronze', 300, 4), (9, 'bronze', 100, 1), (10, 'bronze', 0, 0),
  (16, 'platinum', 5800, 42), (17, 'gold', 1600, 15), (18, 'silver', 550, 6),
  (19, 'bronze', 200, 3), (20, 'bronze', 0, 0), (21, 'gold', 1900, 19),
  (22, 'silver', 800, 10), (23, 'bronze', 100, 1), (24, 'bronze', 0, 0),
  (25, 'bronze', 50, 1)
) AS t(rn, tier, points, visits) ON c.rn = t.rn;

-- Customers 20-40 → UHair
INSERT INTO customer_brand_memberships (customer_id, brand_id, membership_tier, total_points, total_visits)
SELECT c.id, (SELECT id FROM brands WHERE code = 'uhair'), t.tier, t.points, t.visits
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM customers) c
JOIN (VALUES
  (20, 'silver', 900, 11), (26, 'platinum', 6000, 48), (27, 'gold', 2200, 24),
  (28, 'gold', 1600, 14), (29, 'silver', 700, 8), (30, 'silver', 500, 6),
  (31, 'bronze', 300, 4), (32, 'bronze', 150, 2), (33, 'bronze', 50, 1),
  (34, 'bronze', 0, 0), (35, 'bronze', 0, 0), (36, 'gold', 1800, 17),
  (37, 'silver', 600, 7), (38, 'bronze', 200, 3), (39, 'bronze', 0, 0),
  (40, 'bronze', 0, 0)
) AS t(rn, tier, points, visits) ON c.rn = t.rn;

-- Customers 35-50 → Coulisse
INSERT INTO customer_brand_memberships (customer_id, brand_id, membership_tier, total_points, total_visits)
SELECT c.id, (SELECT id FROM brands WHERE code = 'coulisse'), t.tier, t.points, t.visits
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM customers) c
JOIN (VALUES
  (35, 'silver', 800, 10), (41, 'gold', 1900, 18), (42, 'gold', 1500, 14),
  (43, 'silver', 700, 8), (44, 'silver', 500, 6), (45, 'bronze', 300, 4),
  (46, 'bronze', 150, 2), (47, 'bronze', 100, 1), (48, 'bronze', 50, 1),
  (49, 'bronze', 0, 0), (50, 'bronze', 0, 0)
) AS t(rn, tier, points, visits) ON c.rn = t.rn;
