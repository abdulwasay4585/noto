<?php
require 'db.php';
try {
    $pdo->exec("ALTER TABLE users ADD COLUMN first_name TEXT;");
    echo "Added first_name\n";
} catch (Exception $e) { echo $e->getMessage() . "\n"; }
try {
    $pdo->exec("ALTER TABLE users ADD COLUMN last_name TEXT;");
    echo "Added last_name\n";
} catch (Exception $e) { echo $e->getMessage() . "\n"; }
try {
    $pdo->exec("ALTER TABLE users ADD COLUMN phone_number TEXT;");
    echo "Added phone_number\n";
} catch (Exception $e) { echo $e->getMessage() . "\n"; }
try {
    $pdo->exec("ALTER TABLE users ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE;");
    echo "Added terms_accepted\n";
} catch (Exception $e) { echo $e->getMessage() . "\n"; }
echo "Migration finished.\n";
