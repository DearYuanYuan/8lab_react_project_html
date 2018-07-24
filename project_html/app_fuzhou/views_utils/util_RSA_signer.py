#!/usr/bin/env python3
# encoding: utf-8

from base64 import b64encode, b64decode
from Crypto.PublicKey import RSA
from Crypto.Signature import PKCS1_v1_5
from Crypto.Hash import SHA256


class RSASigner(object):
    def __init__(self, pri_key=None, pub_key=None):
        self.pub_key = pub_key  # key_manage.rsa_public()
        self.pri_key = pri_key  # key_manage.rsa_private()

    def verify_sign(self, signature, data):
        '''
        Verifies with a public key from whom the data came that it was indeed
        signed by their private key
        param: public_key_loc Path to public key
        param: signature String signature to be verified
        return: Boolean. True if the signature is valid; False otherwise.
        '''

        rsakey = RSA.importKey(self.pub_key)
        signer = PKCS1_v1_5.new(rsakey)
        digest = SHA256.new()
        # Assumes the data is base64 encoded to begin with
        digest.update(data.encode())
        if signer.verify(digest, b64decode(signature)):
            return True
        return False

    def sign_data(self, data):
        """
        param: private_key_loc Path to your private key
        param: package Data to be signed
        return: base64 encoded signature
        """
        rsakey = RSA.importKey(self.pri_key)
        signer = PKCS1_v1_5.new(rsakey)
        digest = SHA256.new()
        # It's being assumed the data is base64 encoded, so it's decoded before updating the digest
        digest.update(data.encode())
        sign = signer.sign(digest)
        return b64encode(sign).decode()
