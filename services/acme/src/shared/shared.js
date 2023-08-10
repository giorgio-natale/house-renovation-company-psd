export const thirdParties = {
    "plumbers": [3000, 3001, 3002],
    "electricians": [4000, 4001, 4002],
    "constructors": [5000, 5001, 5002]
}

export const electriciansQuotationsStatus = []

let currentId = 0;
export function getNextVal() {
    let freeId = currentId;
    currentId += 1;
    return freeId;
}


