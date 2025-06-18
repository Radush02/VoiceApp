package com.example.voiceapp.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

public class TurnCredentialUtil {

    private static final String HMAC_ALGO = "HmacSHA1";

    public static String generateTurnCredential(String username, String secret) throws Exception {
        SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(), HMAC_ALGO);
        Mac mac = Mac.getInstance(HMAC_ALGO);
        mac.init(keySpec);
        byte[] hmacBytes = mac.doFinal(username.getBytes());
        return Base64.getEncoder().encodeToString(hmacBytes);
    }
}
