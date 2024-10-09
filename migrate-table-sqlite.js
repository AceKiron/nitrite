const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

const dotenv = require("dotenv");
const db = require("better-sqlite3")(path.join(process.cwd(), "database.sqlite3"));

const _internal_table = require("./internal_table");

let env;
if (fs.existsSync(path.join(process.cwd(), ".env"))) {
    env = dotenv.parse(fs.readFileSync(path.join(process.cwd(), ".env"), "utf8"));
} else {
    env = dotenv.parse(fs.readFileSync(path.join(process.cwd(), ".example-env"), "utf8"));
}

function parse_table_creation_instructions(table) {
    let result = table.columns.map((column, index) => `${column.name} ${column.type}${index == table.primaryKey ? " PRIMARY KEY" : `${column.mods & external_table.mods.auto_increment ? " AUTO INCREMENT" : ""}${column.mods & external_table.mods.unique ? " UNIQUE" : ""}${(column.mods & external_table.mods.nullable && column.mods & external_table.mods.auto_increment) == 0 ? "" : " NOT NULL"}${column.mods & external_table.mods.hasDefault ? ` DEFAULT ${column.getDefault()}` : ""}`}`).join(", ");
    
    return result;
}

function parse_insert_into_table_instructions(columns, tableName) {
    const result = {};

    for (const [key, value] of Object.entries(columns)) {
        if (Array.isArray(value)) {
            if (value[0] == "hash") {
                result[`${tableName}_HA_${key}`] = value[1];
                result[`${tableName}_H_${key}`] = value[2];
                result[`${tableName}_HS_${key}`] = value[3];
            }
        } else {
            result[`${tableName}__${key}`] = value;
        }
    }
    
    return result;
}

const external_table = {
    _base: class {
        constructor(type, name, mods) {
            this.type = type;
            this.name = name;
            this.mods = mods;
        }
        
        getDefault() {
            if (this.type == "INTEGER") return this.default;
            else if (this.type == "TEXT") return `'${this.default}'`;
            else if (this.type == "DATETIME") return this.default == external_table.current_timestamp ? this.default : `\`${this.default}\``;
        }
    },

    mods: {
        auto_increment: 2**0,
        unique: 2**1,
        nullable: 2**2,
        hasDefault: 2**3
    },

    current_timestamp: "CURRENT_TIMESTAMP"
};

external_table.integer = class extends external_table._base { constructor(name, mods) { super("INTEGER", name, mods); } }
external_table.string = class extends external_table._base { constructor(name, mods) { super("TEXT", name, mods); } }
external_table.timestamp = class extends external_table._base { constructor(name, mods) { super("DATETIME", name, mods); } }

function conditionFunc(tableName) {
    return {
        equals: function(left, right) {
            return `${left} == ${right}`;
        },

        column: function(key) {
            return `${tableName}.${tableName}__${key}`;
        },

        string: function(text) {
            return `'${text}'`;
        }
    };
}

module.exports = {
    dropIfExists: function(tableName) {
        db.prepare("DROP TABLE IF EXISTS ?;").run(tableName);
        console.log(`Dropped table ${tableName}.`);
    },

    createIfNotExists: function(tableName, callback) {
        const table = new _internal_table(external_table, tableName);
        callback(table);
        db.prepare(`CREATE TABLE IF NOT EXISTS ${tableName} (${parse_table_creation_instructions(table)});`).run();
        console.log(`Created table ${tableName}.`);
    },

    hash: function(plain) {
        const AVAILABLE_PRE_ALGORITHMS = ["sha1", "sha256", "sha512", "md5"];
        
        const preAlgorithm = AVAILABLE_PRE_ALGORITHMS[Math.floor(Math.random() * AVAILABLE_PRE_ALGORITHMS.length)];

        const salt = crypto.randomBytes(24).toString("hex"); // 48
        const pre = crypto.createHash(preAlgorithm).update(env.PASSWORD_PEPPER + plain).digest("hex");
        const hash = crypto.createHash("sha512").update(salt + pre).digest("base64"); // 88

        return ["hash", preAlgorithm, hash, salt];
    },

    insertInto: function(tableName, columns) {
        const actualColumns = parse_insert_into_table_instructions(columns, tableName);
        db.prepare(`INSERT OR IGNORE INTO ${tableName} (${Object.keys(actualColumns).join(", ")}) VALUES (${Object.values(actualColumns).map((val) => /^\d+$/.test(val) ? val : `'${val}'`).join(", ")});`).run();
        console.log(`Inserted entry into table ${tableName}.`);
    },

    deleteWhere: function(tableName, condition) {
        db.prepare(`DELETE FROM ${tableName} WHERE (${condition(conditionFunc(tableName))});`).run();
        console.log(`Deleted entry from ${tableName}.`);
    }
}