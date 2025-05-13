
# test 57f20f883e
# key1 1073741826
# key2 2147483641
def QuickPow(b):
    mod =  65537
    ans = 1
    a1 = 666482
    a2 = 553150
    a = ((((a1 % mod) * getScale(a2)) % mod + a2 % mod) % mod)
    print(a)
    while (b) :
        if (b & 1) :
            ans = (ans * a) % mod
        a = (a * a) % mod
        b >>= 1
    return ans

def QuickPow2(a, b):
    mod =  65537
    ans = 1
    a = a%mod
    while (b) :
        if (b & 1) :
            ans = (ans * a) % mod
        a = (a * a) % mod
        b >>= 1
    return ans

def getScale(a):
    scale = 1
    while a>=10 :
        scale *= 10
        a /= 10
    
    return scale


if __name__ == '__main__':

    a = 14981
    b = 1271459897
    b2 = 1812636853
    t1 = QuickPow2(a, b)
    print(t1)
    t2 = QuickPow2(t1, b2)
    print(t2)
    t3 = QuickPow2(a, b2)
    print(t3)
    t4 = QuickPow2(t3, b)
    print(t4)