<?php
// Allow CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

// Function to get user agent details
function getUserAgent() {
    return $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
}

// Function to get referrer
function getReferrer() {
    return $_SERVER['HTTP_REFERER'] ?? 'Direct';
}

// Check if the request is a POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get the raw POST data
    $rawData = file_get_contents("php://input");

    // Decode the JSON data to PHP array
    $data = json_decode($rawData, true);

    // Check if JSON decoding was successful
    if (json_last_error() === JSON_ERROR_NONE) {
        // Get the user input from the decoded array
        $user_input = $data['user_input'] ?? null;
        $type = $data['type'] ?? null;

        if ($user_input && $type) {
            // Get the user's IP address
            $user_ip = $_SERVER['REMOTE_ADDR'];

            // Create an array to hold the log data
            $log_data = [
                'timestamp' => date('Y-m-d H:i:s'),
                'user_input' => htmlspecialchars($user_input, ENT_QUOTES, 'UTF-8'),
                'user_ip' => $user_ip,
                'type' => htmlspecialchars($type, ENT_QUOTES, 'UTF-8'),
                'user_agent' => htmlspecialchars(getUserAgent(), ENT_QUOTES, 'UTF-8'),
                'referrer' => htmlspecialchars(getReferrer(), ENT_QUOTES, 'UTF-8'),
                'request_method' => $_SERVER['REQUEST_METHOD'],
                'request_uri' => $_SERVER['REQUEST_URI']
            ];

            // Convert the array to a JSON object with pretty print
            $log_json = json_encode($log_data, JSON_PRETTY_PRINT);

            // Log the JSON object to a file
            $log_file = fopen("user_input_log.json", "a");
            if ($log_file) {
                if (flock($log_file, LOCK_EX)) {
                    fwrite($log_file, $log_json . ",\n");
                    flock($log_file, LOCK_UN);
                    fclose($log_file);
                    http_response_code(200);
                    echo "User input has been logged as a JSON object.";
                } else {
                    fclose($log_file);
                    http_response_code(500);
                    echo "Unable to lock the file for writing.";
                }
            } else {
                http_response_code(500);
                echo "Unable to open file!";
            }
        } else {
            http_response_code(400);
            echo "Invalid input data.";
        }
    } else {
        http_response_code(400);
        echo "JSON decoding error: " . json_last_error_msg();
    }
} else {
    http_response_code(405);
    echo "Method not allowed.";
}
?>
