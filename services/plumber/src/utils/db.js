module.exports.quotationDb = {}
module.exports.projectDb = {}

idGeneratorDict = {}
module.exports.getNextVal = (key) => {
    if(idGeneratorDict[key] === undefined)
        idGeneratorDict[key] = 1;
    let freeId = idGeneratorDict[key];
    idGeneratorDict[key] += 1;
    return freeId;
}