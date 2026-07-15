<?php
class Router {
    private $routes = [];
    private $pdo;

    public function __construct($pdo = null) {
        $this->pdo = $pdo;
    }

    public function add($method, $pattern, $handler) {
        // Convert route variables like {id} to regex named groups
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<\1>[a-zA-Z0-9_-]+)', $pattern);
        $pattern = '#^' . $pattern . '$#';
        
        $this->routes[] = [
            'method' => strtoupper($method),
            'pattern' => $pattern,
            'handler' => $handler
        ];
    }

    public function get($pattern, $handler) { $this->add('GET', $pattern, $handler); }
    public function post($pattern, $handler) { $this->add('POST', $pattern, $handler); }
    public function put($pattern, $handler) { $this->add('PUT', $pattern, $handler); }
    public function delete($pattern, $handler) { $this->add('DELETE', $pattern, $handler); }

    public function dispatch($method, $uri) {
        $method = strtoupper($method);
        
        // Remove query string
        $uri = strtok($uri, '?');
        // Clean base path if necessary (e.g. if URI is /api/users, we want /users)
        $uri = str_replace('/api', '', $uri);
        $uri = '/' . trim($uri, '/');
        
        foreach ($this->routes as $route) {
            if ($route['method'] === $method || $route['method'] === 'ANY') {
                if (preg_match($route['pattern'], $uri, $matches)) {
                    // Extract named parameters
                    $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                    
                    // Call the handler
                    if (is_callable($route['handler'])) {
                        return call_user_func_array($route['handler'], [$params]);
                    } elseif (is_string($route['handler'])) {
                        // "ControllerName@methodName"
                        list($controller, $action) = explode('@', $route['handler']);
                        if (class_exists($controller)) {
                            $instance = new $controller($this->pdo);
                            if (method_exists($instance, $action)) {
                                return call_user_func_array([$instance, $action], [$params]);
                            }
                        }
                    }
                }
            }
        }
        
        // Auto-routing fallback for /{controller}/{action}
        // e.g. /tutor/dashboard => TutorController->dashboard()
        $parts = explode('/', trim($uri, '/'));
        if (count($parts) >= 2) {
            $controllerName = ucfirst($parts[0]) . 'Controller';
            $actionName = $parts[1];
            // Convert kebab-case to camelCase for action name (e.g. 'past-papers' -> 'pastPapers')
            $actionName = str_replace('-', '', ucwords($actionName, '-'));
            $actionName = lcfirst($actionName);
            
            if (class_exists($controllerName)) {
                $instance = new $controllerName($this->pdo);
                if (method_exists($instance, $actionName)) {
                    // Pass remaining parts as params
                    $params = array_slice($parts, 2);
                    return call_user_func_array([$instance, $actionName], [$params]);
                }
            }
        }
        
        // Return false so legacy router can take over
        return false;
    }
}
