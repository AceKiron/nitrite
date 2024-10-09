module.exports = class {
    constructor(external_table, tableName) {
        this.external_table = external_table;
        this.tableName = tableName;
        this.columns = [];
        this.primaryKey = null;

        this.mods = external_table.mods;
    }

    id() {
        this.primaryKey = this.columns.push(new this.external_table.integer(`${this.tableName}_id`, this.mods.auto_increment)) - 1;
    }

    string(key, mods, def) {
        if (def !== undefined) {
            mods |= this.mods.hasDefault;

            const column = new this.external_table.string(`${this.tableName}__${key}`, mods);
            column.default = def;
            this.columns.push(column);
        } else {
            this.columns.push(new this.external_table.string(`${this.tableName}__${key}`, mods || 0));
        }
    }

    timestamp(key, mods, def) {
        if (def !== undefined) {
            mods |= this.mods.hasDefault;

            const column = new this.external_table.timestamp(`${this.tableName}__${key}`, mods);
            column.default = def;
            this.columns.push(column);
        } else {
            this.columns.push(new this.external_table.timestamp(`${this.tableName}__${key}`, mods || 0));
        }
    }

    hash(key, mods, def) {
        if (def !== undefined) {
            mods |= this.mods.hasDefault;
            
            const hashColumn = new this.external_table.string(`${this.tableName}_H_${key}`, mods);
            hashColumn.default = def;
            this.columns.push(hashColumn);

            const hashSalt = new this.external_table.string(`${this.tableName}_HS_${key}`, mods);
            hashSalt.default = def;
            this.columns.push(hashSalt);

            const hashPreAlgorithm = new this.external_table.string(`${this.tableName}_HA_${key}`, mods);
            hashPreAlgorithm.default = def;
            this.columns.push(hashPreAlgorithm);
        } else {
            this.columns.push(new this.external_table.string(`${this.tableName}_H_${key}`, mods || 0));
            this.columns.push(new this.external_table.string(`${this.tableName}_HS_${key}`, mods || 0));
            this.columns.push(new this.external_table.string(`${this.tableName}_HA_${key}`, mods || 0));
        }
    }

    timestamps() {
        this.timestamp("created_at", 0, this.external_table.current_timestamp);
        this.timestamp("updated_at", 0, this.external_table.current_timestamp);
    }
}