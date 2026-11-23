-- Parça (component) başına ölçü bilgisi
-- Parçadan "ayrı ürün oluştur" yapıldığında ve ürün ölçü tablosu
-- "Parçalardan doldur" ile çekildiğinde bu değerler kullanılır.

ALTER TABLE product_components ADD COLUMN IF NOT EXISTS dim_width  TEXT DEFAULT NULL;
ALTER TABLE product_components ADD COLUMN IF NOT EXISTS dim_depth  TEXT DEFAULT NULL;
ALTER TABLE product_components ADD COLUMN IF NOT EXISTS dim_height TEXT DEFAULT NULL;
