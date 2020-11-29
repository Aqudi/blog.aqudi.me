---
title: Webserver와 WAS를 사용하는 이유
date: 2020-10-06 16:10:40
category: network
thumbnail: { thumbnailSrc }
draft: true
---

# Webserver의 역할
Webserver에는 Apache Server나 Nginx가 있다.

주로 정적파일들을 전달해주거나

클라이언트의 요청을 WAS로 보내서 동적인 콘텐츠를 WAS로 부터 받고 다시 클라이언트에게 보내주는 역할도 한다.


# WAS(Web Application Server)의 역할

DB에 담긴 데이터를 조회해서 전달을 하거나, 입력받은 데이터를 처리해서 보내주는 등의 동적인 콘텐츠를 제공.

HTTP 요청이 들어오면 컴퓨터의 Application을 수행해주는 미들웨어 역할을 한다.


# Webserver를 사용하는 이유
+ WAS에 부담을 덜기 위해
+ 하나의 Webserver로 여러 대의 WAS로 로드밸런싱