#!/usr/bin/env node

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const EXIT_STATUSES = {
    UNKNOWN_ERROR: -1,
    OK: 0,
    NO_COMMAND_PROVIDED: 1,
    NO_ARGUMENT_PROVIDED: 2,
    UNKNOWN_COMMAND: 3,
    TYPE_ERROR: 4
};

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
    download("app/controllers/APIController.js", rootDir);
    download("app/controllers/IndexController.js", rootDir);
    download("app/database/0_create_users_table.down.js", rootDir);
    download("app/database/0_create_users_table.up.js", rootDir);
    download("app/database/1_insert_demo_user.down.js", rootDir);
    download("app/database/1_insert_demo_user.up.js", rootDir);
    download("app/routers/APIRouter.js", rootDir);
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
    download("core/Database.js", rootDir);
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
    await download(".example-env", rootDir);

    await download("package.json", rootDir);
    cp.exec("npm i", { cwd: rootDir });
}

async function migrate(max) {
    const parsedMax = Number.parseInt(max);

    if (Number.isNaN(parsedMax)) {
        console.error(`'${max}' is not an integer`);
        process.exit(EXIT_STATUSES.TYPE_ERROR);
    }

    fs.readdir(path.join(process.cwd(), "app/database"), null, (err, files) => {
        if (err) {
            console.error(err);
            process.exit(EXIT_STATUSES.UNKNOWN_ERROR);
        }
        
        const filesJson = {};
        for (const file of [...new Set(files.map((value) => value.split(".")[0]))]) {
            const key = Number.parseInt(file.split("_")[0]);
            if (Number.isNaN(key)) {
                console.error(`'${file}' does not start with an integer`);
                process.exit(EXIT_STATUSES.TYPE_ERROR);
            }

            filesJson[key] = {
                down: path.join(process.cwd(), "app/database", file + ".down.js"),
                up: path.join(process.cwd(), "app/database", file + ".up.js"),
            };
        }

        const orderedFilesJson = Object.keys(filesJson).sort().reduce(
            (obj, key) => {
                obj[key] = filesJson[key];
                return obj;
            },
            {}
        );

        const tableModule = require("./migrate-table-sqlite");

        for (const [index, {down, up}] of Object.entries(orderedFilesJson)) {
            if (index <= parsedMax) {
                // Up
                require(up)(tableModule);
            } else {
                // Down
                require(down)(tableModule);
            }
        }
    });
}

const args = process.argv.slice(2);

if (args.length == 0) {
    console.error("Available commands: setup");
    process.exit(EXIT_STATUSES.NO_COMMAND_PROVIDED);
}

if (args[0] == "setup") {
    if (args.length < 2) {
        console.error("Correct syntax: 'npx nitrite setup <dir>'");
        process.exit(EXIT_STATUSES.NO_ARGUMENT_PROVIDED);
    }

    setup(args[1]);
} else if (args[0] == "migrate") {
    if (args.length < 2) {
        console.error("Correct syntax: 'npx nitrite migrate <max>'");
        process.exit(EXIT_STATUSES.NO_ARGUMENT_PROVIDED);
    }

    migrate(args[1]);
} else {
    console.error(`Unknown command: 'npx nitrite ${args[0]}'`);
    process.exit(EXIT_STATUSES.UNKNOWN_COMMAND);
}