
# This file contains all the tool functions that are used in the backend

def listToString(list):
    if list is None:
        return None
    output = str(list).replace('[', '').replace(']', '').replace('\'', '').replace(' ', '')
    # print(output)
    return output

def stringToList(string):
    if string is None:
        return None
    string.replace(' ', '')
    output = string.split(',')
    # print(output)
    return output

# if(__name__ == '__main__'):
#     list = ['a', 'b', 'c']
#     string = listToString(list)
#     print(string)
#     list = stringToList(string)
#     print(list)