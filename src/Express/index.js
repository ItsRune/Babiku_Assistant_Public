const Express = require('express');
const App = Express();
const fs = require('fs');
const path = require('path');
const baseRoute = require('../Utils/Formats/RouteFormat');
const routeOfMiddlewares = path.join(__dirname, './middlewares');

App.use(Express.json());
App.Routes = new Map();

async function loadRoutes(dir, recurrsive=false, prefix='') {
  const dirPath = (recurrsive === true) ? dir : path.join(__dirname, dir);

  fs.readdir(dirPath, (err, files) => {
    if (err) return;
    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      const filePath = path.join(dirPath, fileName);
      const fileNameWithoutEnd = fileName.split(".")[0];

      fs.lstat(filePath, (err, stats) => {
        if (err) return;
        if (stats.isDirectory() === true) {
          return loadRoutes(path.join(dirPath, fileName), true, `${prefix}/${String(fileName).toLowerCase()}`);
        }

        if (fileName.endsWith('.js')) {
          const fileContents = require(filePath);
          if (fileContents.prototype instanceof baseRoute) {
            const newRoute = new fileContents();

            fs.readdir(routeOfMiddlewares, (err, middles) => {
              if (err) return;
              for (let a = 0; a < newRoute.middleware.length; a++) {
                const searchingFor = newRoute.middleware[a];
                const hasFileName = middles.includes(searchingFor);

                if (hasFileName !== true) {
                  const file = require(path.join(routeOfMiddlewares, searchingFor));
                  newRoute.middleware[a] = file;
                } else {
                  newRoute.middleware.slice(a, a);
                };
              };
              
              App.Routes.set(newRoute.route, newRoute);
              App[String(newRoute.method).toLowerCase()](`${prefix}/${fileNameWithoutEnd}${newRoute.route}`, ...newRoute.middleware, newRoute.run);
            });
          };
        };
      });
    };
  });
};

(async () => {
  await loadRoutes('./routes');
})();

module.exports = App;