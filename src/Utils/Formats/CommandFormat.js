class CommandFormat {
    constructor(name, description, alias, usage, dmsAllowed, slashCommand, permissions) {
        this.name = name;
        this.desc = description;
        this.alias = alias;
        this.usage = usage;
        this.slashCommand = slashCommand;
        this.permissions = permissions;
        this.dmsAllowed = dmsAllowed;
    }
};

module.exports = CommandFormat;