INSERT INTO supplier
(company_name, contact_person, phone, city, status)
SELECT 'ABC Pharma Pvt Ltd', 'Rajiv Mehta', '9876543210', 'Pune', 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier WHERE company_name = 'ABC Pharma Pvt Ltd'
);

INSERT INTO supplier
(company_name, contact_person, phone, city, status)
SELECT 'MedLife Distributors', 'Sunil Patil', '9876543211', 'Mumbai', 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier WHERE company_name = 'MedLife Distributors'
);

INSERT INTO supplier
(company_name, contact_person, phone, city, status)
SELECT 'Sunrise Healthcare', 'Amit Shah', '9876543212', 'Nashik', 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier WHERE company_name = 'Sunrise Healthcare'
);

INSERT INTO supplier
(company_name, contact_person, phone, city, status)
SELECT 'CareMed Pharma', 'Neeraj Joshi', '9876543213', 'Jalgaon', 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier WHERE company_name = 'CareMed Pharma'
);

INSERT INTO supplier
(company_name, contact_person, phone, city, status)
SELECT 'HealthPlus Distributors', 'Vijay More', '9876543214', 'Aurangabad', 'INACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier WHERE company_name = 'HealthPlus Distributors'
);

INSERT INTO supplier
(company_name, contact_person, phone, city, status)
SELECT 'MedPlus Distributors', 'Rohit Kulkarni', '9876543215', 'Pune', 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier WHERE company_name = 'MedPlus Distributors'
);

INSERT INTO supplier
(company_name, contact_person, phone, city, status)
SELECT 'HealthCare Supplies', 'Suresh Pawar', '9876543216', 'Mumbai', 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier WHERE company_name = 'HealthCare Supplies'
);

INSERT INTO supplier
(company_name, contact_person, phone, city, status)
SELECT 'BioMed Pharma', 'Karan Joshi', '9876543217', 'Nashik', 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier WHERE company_name = 'BioMed Pharma'
);

INSERT INTO supplier
(company_name, contact_person, phone, city, status)
SELECT 'LifeLine Distributors', 'Manoj Desai', '9876543218', 'Kolhapur', 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier WHERE company_name = 'LifeLine Distributors'
);

INSERT INTO supplier
(company_name, contact_person, phone, city, status)
SELECT 'Active Medicos', 'Vikas Sharma', '9876543219', 'Nagpur', 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier WHERE company_name = 'Active Medicos'
);

INSERT INTO supplier
(company_name, contact_person, phone, city, status)
SELECT 'Prime Medicals', 'Nitin Patil', '9876543220', 'Pune', 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier WHERE company_name = 'Prime Medicals'
);

INSERT INTO supplier
(company_name, contact_person, phone, city, status)
SELECT 'Wellness Distributors', 'Akash More', '9876543221', 'Mumbai', 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier WHERE company_name = 'Wellness Distributors'
);

INSERT INTO supplier
(company_name, contact_person, phone, city, status)
SELECT 'Zenith Pharma', 'Deepak Shah', '9876543222', 'Ahmednagar', 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier WHERE company_name = 'Zenith Pharma'
);

INSERT INTO supplier
(company_name, contact_person, phone, city, status)
SELECT 'CityCare Pharmaceuticals', 'Prakash Jadhav', '9876543223', 'Jalgaon', 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier WHERE company_name = 'CityCare Pharmaceuticals'
);

INSERT INTO supplier
(company_name, contact_person, phone, city, status)
SELECT 'WellCare Medicals', 'Sachin More', '9876543224', 'Aurangabad', 'BLOCKED'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier WHERE company_name = 'WellCare Medicals'
);