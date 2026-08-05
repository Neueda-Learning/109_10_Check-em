package com.payflow.exception;

import org.springframework.http.HttpStatus;

public class ProcessingException extends ApiException {
    public ProcessingException(String message) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, message);
    }
}
