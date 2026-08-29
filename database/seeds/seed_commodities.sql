-- Seed data for commodities reference
INSERT IGNORE INTO commodities (id, name, name_hi, name_pa, category, unit, msp, season, image_url) VALUES
('wheat', 'Wheat', 'गेहूं', 'ਕਣਕ', 'cereals', 'Quintal (100 kg)', 2275.00, 'Rabi (रबी)', 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80'),
('paddy', 'Basmati Paddy', 'बासमती धान', 'ਬਾਸਮਤੀ ਝੋਨਾ', 'cereals', 'Quintal (100 kg)', 2203.00, 'Kharif (खरीफ)', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'),
('mustard', 'Mustard', 'सरसों', 'ਸਰ੍ਹੋਂ', 'oilseeds', 'Quintal (100 kg)', 5650.00, 'Rabi (रबी)', 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=600&q=80'),
('potato', 'Potato', 'आलू', 'ਆਲੂ', 'vegetables', 'Quintal (100 kg)', 0.00, 'Rabi / Winter', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80'),
('onion', 'Red Onion', 'लाल प्याज', 'ਲਾਲ ਪਿਆਜ਼', 'vegetables', 'Quintal (100 kg)', 0.00, 'Kharif / Late Rabi', 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80'),
('tomato', 'Tomato', 'टमाटर', 'ਟਮਾਟਰ', 'vegetables', 'Quintal (100 kg)', 0.00, 'All seasons', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'),
('cotton', 'Cotton', 'कपास / नरमा', 'ਕਪਾਹ / ਨਰਮਾ', 'cash_crops', 'Quintal (100 kg)', 6620.00, 'Kharif (खरीफ)', 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=600&q=80'),
('maize', 'Maize / Corn', 'मक्का', 'ਮੱਕੀ', 'cereals', 'Quintal (100 kg)', 2090.00, 'Kharif & Rabi', 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80'),
('soybean', 'Soybean', 'सोयाबीन', 'ਸੋਇਆਬੀਨ', 'oilseeds', 'Quintal (100 kg)', 4600.00, 'Kharif (खरीफ)', 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80'),
('chana', 'Gram / Chana', 'चना', 'ਛੋਲੇ', 'pulses', 'Quintal (100 kg)', 5440.00, 'Rabi (रबी)', 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80'),
('sugarcane', 'Sugarcane', 'गन्ना', 'ਗੰਨਾ', 'cash_crops', 'Quintal (100 kg)', 315.00, 'Annual', 'https://images.unsplash.com/photo-1589135233689-d41a766c1eb9?auto=format&fit=crop&w=600&q=80'),
('garlic', 'Garlic', 'लहसुन', 'ਲਸਣ', 'vegetables', 'Quintal (100 kg)', 0.00, 'Rabi', 'https://images.unsplash.com/photo-1588615419957-462725e2e858?auto=format&fit=crop&w=600&q=80');
