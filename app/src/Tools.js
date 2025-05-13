
const listToString = (list) => {
    let str = '';
    for (let i = 0; i < list.length; i++) {
        str += list[i] + ',';
    }
    str.substring(0, str.length - 1);
    return str;
}

export { listToString }