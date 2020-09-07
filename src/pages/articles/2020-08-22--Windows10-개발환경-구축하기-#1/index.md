---
title: "Windows10 개발환경 구축하기 #1"
date: "2020-08-02T23:46:37.121Z"
layout: post
draft: true
path: "/posts/windows10-개발환경-구축하기1"
category: "개발환경"
tags:
  - "Windows10"
  - "개발환경"
  - "Development"
  - "WSL"
description: "개발환경은 Linux나 Mac이 훨씬 좋지만, 맥은 너무 비싸고, Ubuntu는 카카오톡도 제대로 안되고...
은행이나 기타 업무를 볼 때 호환성이 너무 떨어진다는 것도 마음에 걸려 선뜻 바꾸지 못했었습니다...
그런데...!! 저와 같은 사람들을 위해 MS가 준비했나봅니다. Windows10에 리눅스 커널이 붙었네요!! 😊"
---

개발환경은 Linux나 Mac이 훨씬 좋지만, 맥은 너무 비싸고, Ubuntu는 카카오톡도 제대로 안되고...
은행이나 기타 업무를 볼 때 호환성이 너무 떨어진다는 것도 마음에 걸려 선뜻 바꾸지 못했었습니다...
그런데...!! 저와 같은 사람들을 위해 MS가 준비했나봅니다. Windows10에 리눅스 커널이 붙었네요!! 😊

<blockquote>
  아래 내용은 아는 선에서 정리한 것이라 부정확할 수 있습니다! <br>
  정확하고 자세한 정보를 원하신다면 아래 걸어둔 링크를 확인해주세요!
</blockquote>

## WSL 소개
WSL은 Windows Subsystem for Linux의 약자로 Windows에 Linux 커널을 붙인 것이다.
WSL1은 Linux 호환 커널 인터페이스를 제공하여 특정 시스템콜을 사용해야하는 작업들을 할 수 없었다고 하는데,
WSL2에 와서는 가상화 기술을 이용해 Linux 커널 자체를 탑재시켰다고 한다!

대신 WSL2는 Hyper-V 라는 가상화 기술을 사용하기 때문에 WSL2를 사용하면 Windows NT 커널도 Hyper-V
위에서 Linux 커널 동등한 레벨(이웃사촌이 된다.)에서 동작하게 된다. 
이렇게 됐을 때 다른 VM 기술들은 사용할 수 없다고 하지만 기존에도 가상머신을 사용하다가 너무 답답하여
듀얼부팅을 이용했던 경험이 있어 굳이 신경쓰이지 않는 문제이다. (아마 특수한 경우를 제외한 모든 분들에게 해당할 것이다.)

<figure>
  <img src="./wsl_architecture.png"> 
  <figcaption>출처 : Microsoft developer <a href="https://www.youtube.com/watch?v=lwhMThePdIo">https://www.youtube.com/watch?v=lwhMThePdIo</a></figcaption>
</figure>

WSL1에서 WSL2로 넘어가면서 가장 반가웠던 것은 Docker를 사용할 수 있게 됬다는 것이다! 👍
WSL1은 Linux 상의 프로세스들을 Windows의 것으로 바꿔서 보여주는데 이제 WSL2는 가상화된 커널로 
Docker가 필요한 커널의 기능들을 모두 가지고 있기 때문에 사용가능하게 된 것이다!

그 외의 장점으로는 Linux 파일시스템과 Windows 파일시스템을 공유할 수 있다는 점인데 Linux에서 /mnt/c /mnt/d 
같은 경로를 이용하여 Windows에 접근할 수 있다. Windows 파일탐색기에서도 네트워크 -> Ubuntu 로 접속해서 확인할 수 있다.

**더 자세한 내용은 아래 링크의 글을 확인해주세요!**  
[Wikipedia - Windows Subsystem for Linux](https://en.wikipedia.org/wiki/Windows_Subsystem_for_Linux)


## WSL 설치하기
