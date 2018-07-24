#!/usr/bin/env python3
# encoding: utf-8

import base64

from Crypto.Cipher import AES


BS = 16         # BLOCK SIZE
pad = lambda s: s + (BS - len(s) % BS) * chr(BS - len(s) % BS)          # build up plaintext to multiple of BLOCK_SIZE
unpad = lambda s: s[:-ord(s[len(s) - 1:])]                              # restore to orginal plaintext


class AESCipher(object):
    # initialize AES
    def __init__(self, key, iv):
        self.key = key  # key_manage.key_generate()        # initialize AES key
        self.iv = iv  # key_manage.iv_generate()          # initialize AES initialization vector. # iv is used to mix up the output of a encryption.

    # Function:  AES encrypt. The same plaintext gets a different cipher for iv being random everytime.
    # Parameter: raw: plaintext
    # Return:    ciphertext, encoded by base64
    def encrypt(self, raw):
        raw = pad(raw)
        cipher = AES.new(self.key, AES.MODE_CBC, self.iv)
        return base64.b64encode(cipher.encrypt(raw)).decode('utf-8')        # base64 encoded cipher.

    # Function:  AES decrypt.
    # Parameter: enc: cipher text
    # Return:    orignal plaintext
    def decrypt(self, enc):
        enc = base64.b64decode(enc)
        cipher = AES.new(self.key, AES.MODE_CBC, self.iv)
        return unpad(cipher.decrypt(enc)).decode('utf-8')

    # Function:  encrypt values in a dictionary.
    # Parameter: dict_data: dict struct
    def dict_encrypt(self, dict_data):
        for key, val in dict_data.items():
            if 'id' not in key:
                dict_data[key] = self.encrypt(str(val))

    # Function:  decrypt values in a dictionary.
    # Parameter: dict_data: dict struct
    def dict_decrypt(self, dict_data):
        for key, val in dict_data.items():
            if 'id' not in key:
                dict_data[key] = self.decrypt(str(val))
