package com.example.voiceapp.service.MessageService;

import com.example.voiceapp.collection.Message;

public interface MessageServiceImpl {


    /**
     *
     * @param message Obiect de tip mesaj. Vezi /collection/Message pentru structura.
     * @return Acelasi obiect de tip mesaj.
     */
    public Message saveMessage(Message message);
}
