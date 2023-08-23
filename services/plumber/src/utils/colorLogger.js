const colorMapping = {
    "R": "\x1b[31m",
    "G": "\x1b[32m",
    "B": "\x1b[34m"
};

const resetChar = "\x1b[0m";

module.exports.log = (message, name) => {
    console.log(colorMapping[name[0].toUpperCase()] + message + resetChar);
}