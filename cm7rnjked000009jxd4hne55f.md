---
title: "Cloudflare Tunnel로 포트포워딩 없이 홈서버 운영하기"
datePublished: Sun Mar 02 2025 13:13:37 GMT+0000 (Coordinated Universal Time)
cuid: cm7rnjked000009jxd4hne55f
slug: cloudflare-tunnel-home-server-without-port-forwarding
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1740921145938/a6c4e0ff-17fc-4042-aa27-0160ad2b73d8.png
tags: cloudflare, homeserver

---

## 들어가며

홈서버를 운영할 때 외부에서 접근할 방법을 고민하면 **포트포워딩**이 가장 먼저 떠오른다. 공유기에서 특정 포트를 열어 외부에서 서버에 접속할 수 있도록 설정하는 방식으로, 많은 홈서버 운영자가 처음 시도하는 방법이다. 하지만 포트포워딩에는 몇 가지 문제점이 있다.

### **포트포워딩의 주요 문제점**

1. **공유기의 NAT 문제** - 공유기는 사설 IP 주소를 공인 IP 주소로 변환하여 여러 기기가 인터넷에 접속할 수 있도록 한다. 이 과정에서 올바른 포트포워딩 설정이 이루어지지 않거나 공유기의 제한이 있을 경우, 외부에서 서버에 접근이 어려울 수 있다.
    
2. **ISP의 공인 IP 제한 (CGNAT 문제)** - 많은 인터넷 서비스 제공업체(ISP)는 가정용 인터넷 사용자에게 개별 공인 IP를 제공하지 않고, \*\*[캐리어급 NAT(Carrier-Grade NAT, CGNAT)](https://en.wikipedia.org/wiki/Carrier-grade_NAT)\*\*를 적용하여 여러 사용자가 하나의 공인 IP를 공유한다. 이 경우, 포트포워딩을 설정하더라도 ISP에서 추가적인 NAT 계층이 존재하기 때문에 외부에서 서버에 직접 접근하는 것이 불가능하다.
    
3. **보안 이슈** - 실제 IP를 노출해야 하므로 해킹 시도나 DDoS 공격에 노출될 위험이 높아진다.
    

Cloudflare Tunnel은 2번 문제를 어떻게 해결할지 조사하던 중 알게 됐다. 자취방의 인터넷이 CGNAT 환경이었기 때문에 공유기의 외부 IP가 `192.168.x.x` 형식의 사설 IP였고, 포트포워딩을 설정해도 외부에서 접근할 수 없었다.

이번 글에서는 **퍼블릭 IP가 없는 상황에서** Cloudflare Tunnel을 사용하여 **포트포워딩 없이** 홈서버를 외부에서 접근 가능하게 설정하는 방법에 대해서 알아보겠다.

## **Cloudflare Tunnel이란?**

Cloudflare Tunnel은 **서버의 실제 IP 주소를 노출하지 않고도 외부에서 안전하게 접근할 수 있도록** 도와주는 서비스다. Tunnel을 사용하면 외부 IP로 트래픽을 보내지 않고 [데몬(cloudflared)](https://github.com/cloudflare/cloudflared)이 아웃바운드 전용 연결을 만들어서 외부로 트래픽을 전달해준다.

HTTP, HTTPS, SSH 등 우리가 홈서버 운영하면서 주로 필요한 프로토콜 모두 지원하고, 한 번 설정한 이후로는 일반적으로 우리가 서버에 접속하는 것과 동일하게 사용할 수 있다.

[https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)

[![HTTP 요청이 Cloudflare 터널과 연결된 애플리케이션에 도달하는 방법](https://developers.cloudflare.com/_astro/handshake.eh3a-Ml1_1IcAgC.webp align="left")](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)

## 포트 포워딩 vs Cloudflare Tunnel

### **포트 포워딩 방식**

* 일반적으로 외부에서 서버에 접속하려면 **공개 IP 주소(public ip)**가 필요하다.
    
* 서버가 연결된 네트워크가 **CGNAT 등으로 공개 IP 주소가 없는 경우** 사용이 불가능하다.
    
* 포트 포워딩을 설정하면, **공개된 IP를 통해 직접 연결**되므로 해커나 봇이 공격할 위험이 있다.
    

### **Cloudflare Tunnel 방식**

* 서버가 직접 인터넷에 노출되지 않는다. 👉 **공개 IP 주소가 필요없다.**
    
* 서버 내부에서 **Cloudflare의 네트워크로 아웃바운드 전용 연결**을 생성한다.
    
* 트래픽이 Cloudflare를 통해서만 전달되므로 **보안이 강화**된다.
    

#### **추가적인 보안 기능 활용 가능**

* **TLS 암호화:** Cloudflare 자체에서 SSL/TLS 인증서를 지원한다.
    
* **DDoS 방어:** Cloudflare의 글로벌 네트워크를 통해 DDoS 공격으로부터 서버를 보호한다.
    
* **웹 애플리케이션 방화벽(WAF)**: 악의적인 트래픽을 필터링하여 애플리케이션을 보호한다.
    

#### **참고 자료 및 추가 읽을거리**

Cloudflare Tunnel에 대해 더 자세히 알고 싶다면 다음 자료를 참고하시기 바랍니다:

* [**Cloudflare Tunnel 공식 문서**](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/): Cloudflare Tunnel의 작동 원리와 설정 방법을 자세히 설명한다.
    
* [**Cloudflare Zero Trust를 이용한 Kubectl**](https://blog.cloudflare.com/ko-kr/kubectl-with-zero-trust/): Cloudflare Zero Trust를 활용하여 쿠버네티스 API에 안전하게 접근하는 방법을 설명한다.
    

## **Cloudflare Tunnel 설정 방법 (MacOS 기준)**

### 사전 준비

​Cloudflare Tunnel을 설정하기 전에, **도메인이 Cloudflare에 등록되어 있어야 한다**. 이를 위해 다음과 같은 사전 준비가 필요하다:​

1. **Cloudflare에 도메인 등록**
    
    * **Cloudflare에서 도메인 구매**: Cloudflare를 통해 직접 도메인을 구매할 수 있다.
        
    * **외부에서 구매한 도메인 등록**: 이미 다른 등록기관에서 도메인을 구매하셨다면, 해당 도메인을 Cloudflare에 추가하고 네임서버를 Cloudflare에서 제공하는 것으로 변경해야 한다.
        
2. **네임서버 변경 절차**
    
    * **도메인 등록기관의 관리 페이지 접속**: 예를 들어, 가비아에서 도메인을 구매하셨다면, 가비아의 도메인 관리 페이지에 로그인한다.​
        
    * **네임서버 정보 수정**: Cloudflare에서 제공하는 네임서버 정보로 기존 네임서버를 변경한다. ​[참고](https://blog.uluru.io/cloudflare/1/)
        
    * **변경 사항 적용 확인**: 네임서버 변경이 완료되면, 변경 사항이 제대로 적용되었는지 확인한다.
        

**참고 자료:**

* 가비아의 네임서버 변경 매뉴얼: [가비아 네임서버 변경 가이드](https://customer.gabia.com/manual/domain/286/991)​
    
* Cloudflare의 A 레코드 설명: [Cloudflare A 레코드 안내](https://www.cloudflare.com/ko-kr/learning/dns/dns-records/dns-a-record/)
    

### 1\. Cloudflare Tunnel 생성

* [https://one.dash.cloudflare.com/](https://one.dash.cloudflare.com/) 로 이동하여 네트워크의 Tunnels 메뉴 접속
    
* 터널 유형에서 `Cloudflared`를 선택한다.
    

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1740919611637/fac2c74f-ccc4-4509-93e2-32aa116321ce.png align="center")

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1740919625128/3d0d8aad-6be9-4704-901e-47248078d52f.png align="center")

### 2\. Cloudflare Daemon (cloudflared) 및 Tunnel 커넥터 설치 및 실행

* 터널 구성에서 자신의 환경을 선택하여 커넥터 설치 및 실행 명령어를 복사하여 실행한다.
    
* 설치가 완료되면 `Connectors` 섹션에 연결된 커넥터가 뜬다.
    

```shell
brew install cloudflared
sudo cloudflared service install <token>
```

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1740919649121/bd5e03fc-f350-480e-bbaf-0171dac3763b.png align="center")

### 3\. 공개 호스트 설정

* 홈서버의 80번 포트에 리버스 프록시에 Cloudflare Tunnel을 연결하고 싶다면 하위 도메인을 와일드 카드 (\*)로 선언해줍니다.
    
    * [test.example.com](http://test.example.com), [home.example.com](http://home.example.com) 처럼 \*.[example.com](http://example.com) 형태의 모든 요청을 받을 수 있게 됩니다.
        

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1740919661157/1846cdd0-4c31-4b5f-bc36-51e34bf8f8b6.png align="center")

### 4\. DNS에 wildcard 도메인 연결하기

* 내 터널 리스트에서 터널 ID를 복사한다.
    

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1740919680338/a57436a1-2807-4f5a-a236-7394677ddbd0.png align="center")

* [`dash.cloudflare.com`](http://dash.cloudflare.com)에 접속하여 DNS 레코드를 추가해준다.
    
    * 유형: CNAME
        
    * 이름: \* (와일드카드)
        
    * 대상: `<Cloudflare Tunnel UUID>.`[`cfargotunnel.com`](http://cfargotunnel.com)
        
    * 프록시 상태: 프록싱됨
        

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1740919771666/895bebac-1bee-40ef-a906-ef975e66459d.png align="center")

## Multi-level subdomain의 ssl 지원 문제

Cloudflare Tunnel 무료 플랜에서는 기본적으로 1단계 서브도메인([`sub.example.com`](http://sub.example.com))에 대해 SSL 인증서를 제공합니다. 그러나 2단계 서브도메인([`sub.sub.example.com`](http://sub.sub.example.com))에 대한 SSL 지원은 재한적이다. 이는 Cloudflare의 기본 무료 SSL 인증서가 와일드카드(`*.`[`example.com`](http://example.com))까지만 적용되기 때문이다.

**해결 방법:**

* **Advanced Certificate Manager 사용**: Cloudflare의 유료 기능을 통해 2단계 서브도메인에도 SSL을 적용할 수 있다. (참고: [https://developers.cloudflare.com/ssl/edge-certificates/advanced-certificate-manager/](https://developers.cloudflare.com/ssl/edge-certificates/advanced-certificate-manager/))
    

## 결론: Cloudflare Tunnel이 정답일까?

Cloudflare Tunnel은 공인 IP가 없거나 사용에 어려움이 있는 사용자나 보안을 강화하고 싶은 경우에 손쉽게 쓸 수 있는 솔루션입니다. 하지만 multi-level subdomain의 SSL 지원 문제나 일부 기능이 유료 플랜에서만 제공되기 때 이런 기능들이 필요하다면 다른 방법을 고민해야 합니다.

| 사용자 유형 | 추천 솔루션 |
| --- | --- |
| 공인 IP가 없고 보안을 강화하고 싶은 경우 | ✅ Cloudflare Tunnel |
| 공인 IP가 있으며 직접 방화벽을 관리할 수 있는 경우 | 🔄 포트포워딩 가능 |

결론적으로, 홈서버를 운영하는데 관리 리소스를 줄이고 안전하게 운영하고 싶다면 cloudflare tunnel을 사용하지 않을 이유가 없는 것 같습니다. 일부 사례 제외하고는 대부분 무료로 사용할 수 있으면서 TLS 인증서를 포함하여 여러 보안 기능들을 기본적으로 제공해주니 혼자서 모든 설정을 할 때보다 훨씬 편리하고 안전합니다.

물론 공부 목적이라면 포트포워딩을 쓰면서 잠재적인 보안 위협 요소들을 하나씩 차단해보는 경험도 좋을 것 같습니다. 이외에 cloudflare tunnel이 안 좋은 상황이나 쓸 수 없는 상황이 더 있다면 댓글로 공유해주시면 좋겠습니다.

글 읽어주셔서 감사합니다!