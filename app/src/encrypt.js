import CryptoJS from 'crypto-js';

const mod = 65537;

// const getScale = (a) => {
//     let scale = 1;
//     while (a >= 10) {
//         scale *= 10;
//         a /= 10;
//     }
//     return scale;
// }

//快速幂，tmp是小整数，b是整数
function QuickPow(a, b) {
    a = a%mod;
    let ans = 1;
    while (b) {
        if (b & 1) {
            ans = ans * a % mod;
        }
        // console.log(BigInt(BigInt(a) * BigInt(a)))
        a = (a * a)% mod;
        b >>= 1;
    }
    return ans;
}

// 输入列表data和密钥key，返回加密后的列表data
const encryptData = (Data, key) => {
    // console.log('edata: ', edata);
    //使用用户密钥，对数据进行加密，用于传输
    let transData = [];
    // for(let e of Data) {
    //     //16进制转10进制：Number('0x'+edata[i])
    //     transData.append(QuickPow(e, parseInt(key), parseInt(mod)));
    // }
    // console.log(typeof Data)
    console.log('key: ', key)
    console.log(Data)
    if (typeof Data === 'string') {
        Data.replace(' ', '')
        Data = Data.split(/[,，\s\n]/)
        console.log('new Data: ', Data)
    }
    for (let i = 0; i < Data.length; i++) {
        let dataString = ""
        let fenceData = FenceEncrypt(Data[i]);
        // 将每个数据分隔为若干个小数据，每个小数据加密后再合并
        for (let j = 0; j < fenceData.length; j++){
            console.log('fenceData[j]: ', fenceData[j])
            let tmpString = QuickPow(parseInt(fenceData[j]), parseInt(key))+""
            // 全部填充为5位一组
            tmpString = tmpString.padStart(5, '0');
            console.log('tmpString: ', tmpString)
            dataString += tmpString;
        }
        // console.log('dataString: ', dataString)
        transData.push(dataString);
    }
    console.log('done: ', transData);
    return transData;
}

// 将16进制字符串转为10进制字符串
function hexToDec(s) {

    function add(x, y) {
        var c = 0, r = [];
        var x = x.split('').map(Number);
        var y = y.split('').map(Number);
        while(x.length || y.length) {
            var s = (x.pop() || 0) + (y.pop() || 0) + c;
            r.unshift(s < 10 ? s : s - 10); 
            c = s < 10 ? 0 : 1;
        }
        if(c) r.unshift(c);
        return r.join('');
    }

    var dec = '0';
    s.split('').forEach(function(chr) {
        var n = parseInt(chr, 16);
        for(var t = 8; t; t >>= 1) {
            dec = add(dec, dec);
            if(n & t) dec = add(dec, '1');
        }
    });
    return dec;
}


// 接收一个字符串，将其分割为大小为5的块，返回分割后的列表
const FenceEncrypt = (data) => {
    let fence = [];
    let start = 0, end = 5;
    for(let i = 0;i*5 < data.length;i++) {
        start = i*5;
        end = (i+1)*5;
        fence[i] = data.substring(start, end);
    }
    console.log('fence: ', fence)
    return fence
}

const pretreatment = (data) => {
    //将读入的数据按空格/换行/逗号分割
    data = data.split(/[,，\s\n]/);
    let len = 0;
    let edata = [];
    for (let i = 0; i < data.length; i++) {
        //去除空元素
        if (data[i] === '') {
            continue;
        }
        //使用MD5进行哈希处理
        edata[len] = CryptoJS.MD5(data[i]).toString(CryptoJS.enc.Hex)
        //截取9-24位
        edata[len] = edata[len].substring(8, 24);
        //将16进制转为10进制
        edata[len] = hexToDec(edata[len]);
        len++;
    }
    return edata
}

export { encryptData, pretreatment }