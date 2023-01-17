class Route {
    constructor(route, method, middleware=[]) {
        this.route = route;
        this.method = method;
        this.middleware = middleware;
    }
}

module.exports = Route;