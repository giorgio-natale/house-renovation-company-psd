module.exports.sendResponse = (res, statusCode, bodyResponse) => {
    res
    .set({ 'content-type': 'application/json; charset=utf-8' })
    .status(statusCode)
    .send(bodyResponse);
}