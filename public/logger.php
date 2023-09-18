<?php
// Allow CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

// Check if the request is a POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get the raw POST data
    $rawData = file_get_contents("php://input");

    // Decode the JSON data to PHP array
    $data = json_decode($rawData, true);

    // Get the user input from the decoded array
    $user_input = $data['user_input'];

    // Get the user's IP address
    $user_ip = $_SERVER['REMOTE_ADDR'];

    // Create an array to hold the log data
    $log_data = [
        'timestamp' => date('Y-m-d H:i:s'),
        'user_input' => $user_input,
        'user_ip' => $user_ip,
        'type' => $data['type']
    ];

    // Convert the array to a JSON object
    $log_json = json_encode($log_data);

    // Log the JSON object to a file
    $log_file = fopen("user_input_log.json", "a") or die("Unable to open file!");
    fwrite($log_file, $log_json . "\n");
    fclose($log_file);

    echo "User input has been logged as a JSON object.";
} else {
    echo "No data to log.";
}
?>
