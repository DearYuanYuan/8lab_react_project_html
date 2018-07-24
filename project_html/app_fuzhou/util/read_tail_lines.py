# _*_ coding:utf-8 _*_
# import sys
# import time

import chardet


class Tail(object):
    def __init__(self,file_name):
        self.file_name = file_name

    def readTailLines(self, n=10):
        try:
            with open(self.file_name, 'rb') as f:
                self._file=f
                self._file.seek(0, 2)  # 定位到文件最后
                self.file_length = self._file.tell()  # 获取文件长度
                return self.showLastLines(n)
        except Exception as e:
            print('打开文件失败，或者在操作文件的过程中发生错误！')
            print('错误信息:', e)

    def showLastLines(self, n):
        len_line = 100  # 暂且估计 文件中一行包含100个字符
        # 读取最后n行的数据,最后第n行可能不完整;所以下面使用的是n+1,以保证最后n行数据是完整的.
        read_len = len_line*(n+1)  # 最后n+1行 共 包含的字符数
        self._file.seek(0)
        temp = self._file.read(100)  # 读取前面100字节数据
        f_charinfo = chardet.detect(temp)  # 检测编码模式
        # print('f_charinfo=', f_charinfo)
        while True:
            if read_len >= self.file_length:  # 文件长度很小
                self._file.seek(0)  # 定位到文件开头，一次性将文件读完
                # 通过split('\n')获得的列表，最后一个元素是空字符串；切片时，-1的作用就是将最后的空串去掉
                # last_lines保存最后n行的数据
                last_lines = self._file.read().decode(f_charinfo['encoding'],
                                                      'ignore').split('\n')[-(n+1):-1]
                break
            # 若文件很大，需要执行下面的操作
            self._file.seek(-read_len,2) # 定位到 距离 文件末尾read_len个字节处
            last_words =self._file.read(read_len).decode(f_charinfo['encoding'],
                                                         'ignore')
            count = last_words.count('\n') # 统计'\n'的个数
            # if count == 0:  # 对于unicode-escape编码模式，做特殊处理。
            #     self._file.seek(-read_len,2)
            #     last_words = self._file.read(read_len).decode('unicode-escape',
            #                                                   'ignore')
            #     count = last_words.count('\n')
            if count >= n+1:
                # 读取的数据包含的'\n'个数多于n+1，直接从读取的数据中取出最后的n行
                last_lines = last_words.split('\n')
                if last_lines[-1] == '':
                    last_lines = last_lines[-(n+1):-1]
                else:
                    last_lines = last_lines[-n:]
                break
            else:
                # 读取的数据包含的'\n'个数小于n，说明已读取的数据不足n行
                len_perline = int(read_len/count)+10  # 重新计算每行的字符数
                read_len = len_perline*(n+1)  # 重新计算需要读取的字节总数
        # print('last_lines=', last_lines)
        # for line in last_lines:
        #     print(line)
        return last_lines

'''
if __name__ == '__main__':
    t1 = time.time()
    if len(sys.argv)<3:
        print('请输入3个参数：1》要执行的文件 2》需要读取最后多少行 3》需要读取的文件路径')
    else:
        try:
            tail = Tail(sys.argv[2])
            tail.readTailLines(int(sys.argv[1]))
        except Exception as e:
            print('出现错误:',e)
    t2 = time.time()
    print('消耗的时间是：{0}s'.format(t2-t1))
'''