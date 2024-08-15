#!/usr/bin/env node

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

async function download(src, destDir) {
    return (await axios({
        method: "get",
        url: "https://raw.githubusercontent.com/AceKiron/nitrate/main/" + src,
        responseType: "stream"
    })).data.pipe(fs.createWriteStream(path.join(destDir, src)));
}

function createDirectory(dir) {
    return fs.promises.mkdir(dir, { recursive: true });
}

async function setup(subdir) {
    const rootDir = path.join(process.cwd(), subdir);

    await createDirectory(path.join(rootDir, "app/controllers"));
    await createDirectory(path.join(rootDir, "app/database"));
    await createDirectory(path.join(rootDir, "app/routers"));
    download("app/controllers/IndexController.js", rootDir);
    download("app/database/0_create_users_table.js", rootDir);
    download("app/routers/IndexRouter.js", rootDir);

    await createDirectory(path.join(rootDir, "core/controllers"));
    await createDirectory(path.join(rootDir, "core/routers"));
    await createDirectory(path.join(rootDir, "core/www/js"));
    await createDirectory(path.join(rootDir, "core/www/sass/components"));
    await createDirectory(path.join(rootDir, "core/www/sass/utils"));
    download("core/controllers/CoreController.js", rootDir);
    download("core/routers/CoreRouter.js", rootDir);
    download("core/www/js/dollar.js", rootDir);
    download("core/www/sass/components/_button.scss", rootDir);
    download("core/www/sass/utils/_cursor.scss", rootDir);
    download("core/www/sass/utils/_display.scss", rootDir);
    download("core/www/sass/utils/_font.scss", rootDir);
    download("core/www/sass/utils/_gap.scss", rootDir);
    download("core/www/sass/utils/_grid.scss", rootDir);
    download("core/www/sass/utils/_margin.scss", rootDir);
    download("core/www/sass/utils/_misc.scss", rootDir);
    download("core/www/sass/utils/_padding.scss", rootDir);
    download("core/www/sass/utils/_radius.scss", rootDir);
    download("core/www/sass/utils/_size.scss", rootDir);
    download("core/www/sass/_colors.scss", rootDir);
    download("core/www/sass/_variables.scss", rootDir);
    download("core/www/sass/index.scss", rootDir);
    download("core/www/sass/index.scss", rootDir);
    download("core/Application.js", rootDir);
    download("core/Request.js", rootDir);
    download("core/Response.js", rootDir);
    download("core/Router.js", rootDir);
    download("core/Server.js", rootDir);
    download("core/index.js", rootDir);
    
    await createDirectory(path.join(rootDir, "public"));
    download("public/bundle.css", rootDir);
    download("public/bundle.js", rootDir);
    
    await createDirectory(path.join(rootDir, "resources/js"));
    await createDirectory(path.join(rootDir, "resources/sass"));
    download("resources/js/index.js", rootDir);
    download("resources/sass/index.scss", rootDir);
    download("resources/sass/variables.scss", rootDir);

    await createDirectory(path.join(rootDir, "views/errors"));
    await createDirectory(path.join(rootDir, "views/layouts"));
    download("views/errors/404.njk", rootDir);
    download("views/layouts/main.njk", rootDir);
    download("views/homepage.njk", rootDir);

    download(".gitignore", rootDir);
    download("gulpfile.js", rootDir);
    await download("package.json", rootDir);

    cp.exec("npm i", { cwd: rootDir });
}

const args = process.argv.slice(2);

if (args.length == 0) {
    console.error("Available commands: setup");
    process.exit(1);
}

if (args[0] == "setup") {
    if (args.length < 2) {
        console.error("Correct syntax: 'npx nitrite setup <dir>'");
        process.exit(2);
    }

    setup(args[1]);
} else {
    console.error(`Unknown command: 'npx nitrite ${args[0]}'`);
    process.exit(3);
}