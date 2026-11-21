-- ============================================================
-- Sando Fruit  |  Database MySQL untuk phpMyAdmin
-- Cara pakai: phpMyAdmin > Import > pilih file ini > Go
-- (Gunakan SALAH SATU: import file ini ATAU php artisan migrate --seed)
-- Login admin awal: admin@gmail.com / 12345678  (segera ganti!)
-- ============================================================
CREATE DATABASE IF NOT EXISTS `sando_fruit` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sando_fruit`;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `wishlists`, `order_items`, `orders`, `products`, `password_reset_tokens`, `users`;

CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `role` varchar(20) NOT NULL DEFAULT 'customer',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `products` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `flavor` varchar(4) NOT NULL COMMENT 'kode gambar sando',
  `tagline` varchar(150) DEFAULT NULL,
  `price` int unsigned NOT NULL,
  `badge` varchar(30) DEFAULT NULL,
  `emoji` varchar(8) DEFAULT NULL,
  `ingredient` varchar(50) DEFAULT NULL,
  `rating` decimal(2,1) NOT NULL DEFAULT 4.5,
  `reviews` int unsigned NOT NULL DEFAULT 0,
  `stock` int NOT NULL DEFAULT 0,
  `description` text,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(30) NOT NULL COMMENT 'order_id di Midtrans',
  `user_id` bigint unsigned NOT NULL,
  `recipient` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `note` varchar(200) DEFAULT NULL,
  `payment_method` varchar(40) NOT NULL,
  `subtotal` int unsigned NOT NULL,
  `shipping` int unsigned NOT NULL DEFAULT 0,
  `total` int unsigned NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Menunggu bayar',
  `payment_status` varchar(15) NOT NULL DEFAULT 'pending',
  `snap_token` varchar(255) DEFAULT NULL,
  `midtrans_transaction_id` varchar(255) DEFAULT NULL,
  `midtrans_payment_type` varchar(40) DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `stock_restored` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_code_unique` (`code`),
  KEY `orders_user_id_foreign` (`user_id`),
  CONSTRAINT `orders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` int unsigned NOT NULL,
  `qty` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_foreign` (`order_id`),
  KEY `order_items_product_id_foreign` (`product_id`),
  CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `wishlists` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `wishlists_user_id_product_id_unique` (`user_id`,`product_id`),
  KEY `wishlists_product_id_foreign` (`product_id`),
  CONSTRAINT `wishlists_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wishlists_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO `products` (`id`,`name`,`flavor`,`tagline`,`price`,`badge`,`emoji`,`ingredient`,`rating`,`reviews`,`stock`,`description`,`created_at`,`updated_at`) VALUES
(1,'Strawberry Sando','st','Stroberi segar, whipped cream vanila',28000,'Best Seller','🍓','Strawberry',4.8,120,25,'Sando buah dengan roti tawar lembut, whipped cream yang creamy, dan potongan buah stroberi segar. Rasanya manis, creamy, dan menyegarkan.',NOW(),NOW()),
(2,'Sando Mangga','mg','Mangga harum manis, krim keju lembut',30000,NULL,'🥭','Mangga',4.7,86,18,'Sando buah dengan roti tawar lembut, whipped cream yang creamy, dan potongan buah mangga harum manis. Rasanya manis legit dan lembut di mulut.',NOW(),NOW()),
(3,'Sando Kiwi','kw','Kiwi asam segar, krim susu',29000,'Baru','🥝','Kiwi',4.6,54,12,'Sando buah dengan roti tawar lembut, whipped cream yang creamy, dan potongan buah kiwi segar. Rasanya segar dengan sedikit asam yang pas.',NOW(),NOW()),
(4,'Sando Mix Fruit','mx','Stroberi, kiwi, dan jeruk mandarin',35000,'Favorit','🍊','Jeruk',4.9,142,20,'Sando buah dengan roti tawar lembut, whipped cream yang creamy, dan potongan buah stroberi, kiwi, dan jeruk mandarin. Rasanya kaya rasa dan menyegarkan.',NOW(),NOW()),
(5,'Sando Blueberry','bb','Blueberry, krim yoghurt',32000,NULL,'🫐','Blueberry',4.7,68,15,'Sando buah dengan roti tawar lembut, whipped cream yang creamy, dan potongan buah blueberry. Rasanya manis asam yang lembut.',NOW(),NOW());

INSERT INTO `users` (`name`,`email`,`phone`,`address`,`role`,`password`,`created_at`,`updated_at`) VALUES
('Admin','admin@gmail.com','081234567890','Toko Sando Fruit','admin','$2y$10$l0swpYaOVRcFj/hKqFTzo.5O9oDMeOlCr0NQ2oDIAlrjS6GDejmS2',NOW(),NOW());
