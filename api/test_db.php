<?php
require 'db.php';
$stmt = $pdo->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
print_r($stmt->fetchAll());
