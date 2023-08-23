export const thirdParties = {
    "plumbers": [3000, 3001],
    "electricians": [4000, 4001],
    "constructors": [5000, 5001]
}

export const electriciansQuotationsStatus = []

let currentId = 0;
export function getNextVal() {
    let freeId = currentId;
    currentId += 1;
    return freeId;
}


