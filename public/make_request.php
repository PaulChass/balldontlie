<?php
$url = 'https://balldontlie.fr/index.php/check'; // Replace with your actual URL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

// Optionally, you can log the response or handle it in another way
// For example, you might want to log the response to a file:
// file_put_contents('request_log.txt', $response . PHP_EOL, FILE_APPEND);