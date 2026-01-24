---
title: "Cloudflare Tunnel로 포트포워딩 없이 홈서버 운영하기"
datePublished: Sun Mar 02 2025 13:13:37 GMT+0000 (Coordinated Universal Time)
cuid: cm7rnjked000009jxd4hne55f
slug: cloudflare-tunnel-home-server-without-port-forwarding
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1740921145938/a6c4e0ff-17fc-4042-aa27-0160ad2b73d8.png
tags: cloudflare, homeserver

---


> **이 글에서 다루는 내용**
> - 포트포워딩이 안 되는 이유 (CGNAT 환경 이해)
> - CGNAT 우회 방법들의 장단점 비교
> - Cloudflare Tunnel 설정 방법 (MacOS 기준)

외부에서 내 PC로 접근할 수 있도록 허용하는 방법을 생각하면 **포트포워딩**이 가장 먼저 떠오릅니다. 공유기에서 특정 포트를 열어 외부에서 서버에 접속할 수 있도록 설정하는 방식으로, 마인크래프트 멀티를 해보셨던 분이라면 분명 해보셨을 방법입니다. 😊

작년에 저는 홈서버에 제가 쓰고 싶은 서비스를 띄워두고 쓰려고 서버를 배포했었습니다. 그런데 포트포워딩을 하고 접속 테스트를 하려고 공유기 설정에 들어가보니 외부 IP가 `192.168.x.x` 형태로 되어 있고 외부에서 접속이 안 됐습니다. 굉장히 난감했죠...

이번 글에서는 제가 겪었던 CGNAT이라는 환경에 대한 설명을 포함한 포트포워딩의 주요 문제점과 여러 해결법 중 제가 선택한 Cloudflare Tunnel 사용법까지 정리해보겠습니다.

## 포트포워딩의 주요 문제점

포트포워딩이 항상 동작하는 것은 아닙니다. 제가 겪었던 것처럼 안 되는 경우가 있는데, 주로 다음 세 가지 이유 때문입니다.

### 1. 공유기의 NAT 설정 문제
공유기는 사설 IP 주소를 공인 IP 주소로 변환하여 여러 기기가 인터넷에 접속할 수 있도록 합니다. 이 과정에서 올바른 포트포워딩 설정이 이루어지지 않거나 공유기의 제한이 있을 경우, 외부에서 서버에 접근이 어려울 수 있습니다.

이 경우는 설정을 다시 확인하면 대부분 해결됩니다.

### 2. ISP의 공인 IP 제한 (CGNAT 문제)

**CGNAT가 뭔가요?**

CGNAT(Carrier-Grade NAT)는 **ISP가 여러 사용자에게 하나의 공인 IP를 공유하게 만드는 기술**입니다. IPv4 주소가 부족해지면서 ISP들이 비용 절감을 위해 도입했습니다.

**왜 포트포워딩이 안 되나요?**

CGNAT 환경에서는 이중 NAT 구조가 됩니다:

```text
외부 → ISP의 CGNAT → 공유기 → 홈서버
```

포트포워딩을 설정해도 ISP 레벨에서 추가적인 NAT 계층이 존재하기 때문에 외부에서 서버에 직접 접근할 수 없습니다. 외부에서 들어오는 연결이 수십~수백 명의 사용자 중 누구에게 보내야 할지 ISP가 알 수 없기 때문이죠.

**내가 CGNAT 환경인지 확인하는 방법**

1. 공유기 관리 페이지에서 WAN IP를 확인합니다.
2. "내 IP 확인" 사이트(예: whatismyip.com)에서 공인 IP를 확인합니다.
3. 두 IP가 다르면 CGNAT 환경입니다.
4. 특히 WAN IP가 `100.64.x.x` ~ `100.127.x.x` 형태면 거의 확정입니다.

제 경우, 자취방의 인터넷이 CGNAT 환경이었기 때문에 공유기의 WAN IP가 `192.168.x.x` 형식의 사설 IP였고, 포트포워딩을 설정해도 외부에서 접근할 수 없었습니다.

### 3. 보안 이슈
포트포워딩이 되더라도 실제 IP를 노출해야 하므로 해킹 시도나 DDoS 공격에 노출될 위험이 높아집니다. 포트가 열려있다는 것 자체가 공격 표면이 되기 때문입니다.

---

이러한 문제들을 해결하기 위해 **Cloudflare Tunnel**을 활용하면 **포트포워딩 없이도 안전하게 홈서버를 운영할 수 있습니다.**

## Cloudflare Tunnel이란?

Cloudflare Tunnel(구 Argo Tunnel)은 **서버의 IP를 공개하지 않고도 외부에서 접속할 수 있게 해주는 서비스**입니다. 기존 포트포워딩 방식과 가장 큰 차이점은 **공유기에서 포트를 열 필요가 없다는 점**입니다.

### 기존 포트포워딩 방식

```text
외부 클라이언트 → 공유기 포트포워딩 → 홈서버
```

- ✅ 서버가 직접 외부에서 접근 가능  
- ❌ 포트가 노출되므로 해킹 위험 존재
- ❌ CGNAT 환경에서는 사용 불가

### Cloudflare Tunnel 방식

```text
홈서버 → Cloudflare Tunnel → Cloudflare → 외부 클라이언트
```

- ✅ 서버의 IP가 노출되지 않음  
- ✅ 포트포워딩 필요 없음 → CGNAT 문제 해결  
- ✅ Cloudflare의 보안 기능 활용 가능

핵심은 **연결 방향이 반대**라는 점입니다. 포트포워딩은 외부에서 들어오는 연결을 받아야 하지만, Cloudflare Tunnel은 홈서버가 먼저 Cloudflare로 연결을 만들고, Cloudflare가 외부 요청을 중계해줍니다. 그래서 포트를 열 필요가 없고, CGNAT 환경에서도 동작합니다.

게다가 Cloudflare는 대부분의 경우 무료로 사용할 수 있으며, TLS 인증서 자동 발급, DDoS 방어, WAF(Web Application Firewall)까지 기본 제공됩니다.

이런 이유로 홈서버를 운영할 때 포트포워딩 대신 Cloudflare Tunnel을 사용하기로 했습니다.

## CGNAT 우회 방법 비교

Cloudflare Tunnel 외에도 CGNAT를 우회하는 여러 방법이 있습니다:

| 방법 | 장점 | 단점 | 월 비용 |
|------|------|------|--------|
| **ISP에 공인 IP 요청** | 근본적 해결 | 거부당할 수 있음 | 무료~추가 비용 |
| **VPS + VPN (WireGuard)** | 완전한 제어 | 설정 복잡, 관리 부담 | $2~10 |
| **Ngrok** | 빠른 설정 | 무료 플랜 제한 많음 | $8~25 |
| **Tailscale** | P2P 메쉬 네트워크 | 공개 웹 서비스엔 부적합 | 무료 (개인용) |
| **Cloudflare Tunnel** | 무료, 보안 강화, 간단 | 속도 저하 가능성 | 무료 |

**Cloudflare Tunnel을 선택한 이유:**

- **완전 무료**: 다른 솔루션들은 유료이거나 기능 제한이 있음
- **보안 자동화**: TLS 인증서 자동 발급, DDoS 방어, WAF 기본 제공
- **설정 간단**: VPS + VPN 조합은 설정과 유지보수가 복잡함
- **글로벌 CDN**: Cloudflare 네트워크를 통해 전 세계 어디서든 빠른 접속

물론 Cloudflare에 의존하게 된다는 단점이 있지만, 개인 홈서버 용도로는 충분히 트레이드오프할 만하다고 생각했습니다. 

## Cloudflare Tunnel 설정 방법 (MacOS 기준)

### 사전 준비

Cloudflare Tunnel을 설정하기 전에, **도메인이 Cloudflare에 등록되어 있어야 합니다**. Cloudflare가 도메인의 DNS를 관리해야 터널과 연결할 수 있기 때문입니다.

**1. Cloudflare에 도메인 등록**
- **Cloudflare에서 도메인 구매**: Cloudflare를 통해 직접 도메인을 구매할 수 있습니다.
- **외부에서 구매한 도메인 등록**: 이미 다른 등록기관에서 도메인을 구매했다면, 해당 도메인을 Cloudflare에 추가하고 네임서버를 Cloudflare에서 제공하는 것으로 변경하면 됩니다.

**2. 네임서버 변경 절차**
- 도메인 등록기관(예: 가비아)의 관리 페이지에 로그인합니다.
- Cloudflare에서 제공하는 네임서버 정보로 기존 네임서버를 변경합니다.
- 네임서버 변경이 완료되면, 변경 사항이 제대로 적용되었는지 확인합니다. (최대 24시간 소요)

**참고 자료:**
- [가비아 네임서버 변경 가이드](https://customer.gabia.com/manual/domain/286/991)
- [Cloudflare에 도메인 추가하기](https://blog.uluru.io/cloudflare/1/)

### 1. Cloudflare Tunnel 생성

> 터널을 생성하면 Cloudflare에서 고유한 터널 ID를 부여받습니다. 이 ID를 통해 홈서버와 Cloudflare가 연결됩니다.

- [one.dash.cloudflare.com](https://one.dash.cloudflare.com/)으로 이동하여 **네트워크 > Tunnels** 메뉴에 접속합니다.
- 터널 유형에서 `Cloudflared`를 선택합니다.

![Cloudflare Tunnel 생성 1](https://cdn.hashnode.com/res/hashnode/image/upload/v1740919611637/fac2c74f-ccc4-4509-93e2-32aa116321ce.png)

![Cloudflare Tunnel 생성 2](https://cdn.hashnode.com/res/hashnode/image/upload/v1740919625128/3d0d8aad-6be9-4704-901e-47248078d52f.png)

### 2. Cloudflare Tunnel 커넥터 설치 및 실행

> 커넥터(cloudflared)는 홈서버에서 실행되며, Cloudflare로 아웃바운드 연결을 유지합니다. 이 연결을 통해 외부 트래픽이 홈서버로 전달됩니다.

- 터널 구성에서 자신의 환경(MacOS/Linux/Windows/Docker)을 선택합니다.
- 표시된 명령어를 복사하여 터미널에서 실행합니다.

```shell
brew install cloudflared
sudo cloudflared service install <token>
```

- 설치가 완료되면 `Connectors` 섹션에 연결된 커넥터가 표시됩니다.

![Cloudflare Tunnel 커넥터 연결 확인](https://cdn.hashnode.com/res/hashnode/image/upload/v1740919649121/bd5e03fc-f350-480e-bbaf-0171dac3763b.png)

### 3. 공개 호스트 설정

> 어떤 도메인으로 들어온 요청을 홈서버의 어느 포트로 전달할지 설정합니다.

- 홈서버의 80번 포트(리버스 프록시)에 Cloudflare Tunnel을 연결하고 싶다면 하위 도메인을 와일드카드(*)로 선언합니다.
- `*.example.com` 형태로 설정하면 `test.example.com`, `home.example.com` 등 모든 서브도메인 요청을 받을 수 있습니다.

![공개 호스트 설정](https://cdn.hashnode.com/res/hashnode/image/upload/v1740919661157/1846cdd0-4c31-4b5f-bc36-51e34bf8f8b6.png)

### 4. DNS에 Wildcard 도메인 연결하기

> DNS 레코드를 추가해야 Cloudflare가 해당 도메인으로 들어오는 요청을 터널로 라우팅할 수 있습니다.

**터널 ID 복사:**
- 터널 리스트에서 방금 생성한 터널의 ID를 복사합니다.

![터널 ID 복사](https://cdn.hashnode.com/res/hashnode/image/upload/v1740919680338/a57436a1-2807-4f5a-a236-7394677ddbd0.png)

**DNS 레코드 추가:**
- [dash.cloudflare.com](https://dash.cloudflare.com)에 접속하여 DNS 레코드를 추가합니다.
  - **유형**: CNAME
  - **이름**: * (와일드카드)
  - **대상**: `<터널 UUID>.cfargotunnel.com`
  - **프록시 상태**: 프록싱됨 (주황색 구름 아이콘)

![DNS 레코드 추가](https://cdn.hashnode.com/res/hashnode/image/upload/v1740919771666/895bebac-1bee-40ef-a906-ef975e66459d.png)

## 주의사항: Multi-level Subdomain SSL 제한

Cloudflare Tunnel 무료 플랜에서는 1단계 서브도메인(`sub.example.com`)에 대해서만 SSL 인증서가 제공됩니다. 2단계 서브도메인(`sub.sub.example.com`)은 SSL이 적용되지 않습니다.

**왜 그런가요?**

Cloudflare의 무료 SSL 인증서가 와일드카드(`*.example.com`)까지만 적용되기 때문입니다. `*.*.example.com`은 지원되지 않습니다.

**해결 방법:**

| 방법 | 설명 | 비용 |
|------|------|------|
| **1단계 서브도메인만 사용** | `app.example.com` 형태로 구성 (권장) | 무료 |
| **Advanced Certificate Manager** | Cloudflare 유료 기능으로 2단계 지원 | 월 $10 |
| **자체 인증서 업로드** | Let's Encrypt 등으로 발급받아 업로드 | 무료 (수동 관리) |

대부분의 경우 1단계 서브도메인으로 충분하므로, 굳이 복잡하게 구성할 필요는 없습니다.

**참고:** [Cloudflare Advanced Certificate Manager](https://developers.cloudflare.com/ssl/edge-certificates/advanced-certificate-manager/)

## 결론: Cloudflare Tunnel이 정답일까?

Cloudflare Tunnel은 공인 IP가 없거나 사용에 어려움이 있는 사용자나 보안을 강화하고 싶은 경우에 손쉽게 쓸 수 있는 솔루션입니다. 하지만 몇 가지 고려할 점이 있습니다.

### 알아둘 점

**장점:**
- 무료로 대부분의 기능 사용 가능
- TLS 인증서, DDoS 방어, WAF 기본 제공
- 설정이 간단하고 관리 부담이 적음
- 포트 개방 불필요로 보안 강화

**제약사항:**
- Multi-level subdomain (`sub.sub.example.com`)은 유료 플랜 필요
- 일부 사용자는 직접 프록시보다 속도 저하 경험
- Cloudflare에 대한 의존성

### 사용자 유형별 추천

| 사용자 유형 | 추천 솔루션 |
|-------------|-------------|
| 공인 IP가 없고 보안을 강화하고 싶은 경우 | ✅ Cloudflare Tunnel |
| 공인 IP가 있으며 직접 방화벽을 관리할 수 있는 경우 | 🔄 포트포워딩 가능 |
| 완전한 제어가 필요한 경우 | VPS + VPN |
| 개발 테스트 목적 | Ngrok |

저는 현재 n8n, karakeep, vaultwarden 등을 Cloudflare Tunnel로 운영하고 있는데, 설정 한 번으로 포트포워딩 고민 없이 안정적으로 사용하고 있습니다. 홈서버를 운영하면서 관리 리소스를 줄이고 안전하게 운영하고 싶다면 Cloudflare Tunnel을 적극 추천합니다.

물론 공부 목적이라면 포트포워딩을 쓰면서 잠재적인 보안 위협 요소들을 하나씩 차단해보는 경험도 좋을 것 같습니다. Cloudflare Tunnel이 안 좋은 상황이나 쓸 수 없는 상황이 더 있다면 댓글로 공유해주시면 좋겠습니다.