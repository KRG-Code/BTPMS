class RTCManager {
  constructor(socket, userId) {
    this.socket = socket;
    this.userId = userId;
    this.peerConnections = new Map();
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.socket.on('rtc-offer', async ({ offer, from }) => {
      const peerConnection = this.createPeerConnection(from);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      this.socket.emit('rtc-answer', { target: from, answer });
    });

    this.socket.on('rtc-answer', async ({ answer }) => {
      const peerConnection = this.peerConnections.get(answer.from);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    this.socket.on('rtc-ice-candidate', async ({ candidate }) => {
      const peerConnection = this.peerConnections.get(candidate.from);
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
  }

  createPeerConnection(targetUserId) {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    };

    const peerConnection = new RTCPeerConnection(configuration);
    this.peerConnections.set(targetUserId, peerConnection);

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('rtc-ice-candidate', {
          target: targetUserId,
          candidate: event.candidate
        });
      }
    };

    // Create data channel for messages
    const dataChannel = peerConnection.createDataChannel('messages');
    this.setupDataChannel(dataChannel);

    return peerConnection;
  }

  setupDataChannel(dataChannel) {
    dataChannel.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // Emit a custom event that ConversationModal can listen to
      window.dispatchEvent(new CustomEvent('rtc-message', { detail: message }));
    };
  }

  async initiateConnection(targetUserId) {
    const peerConnection = this.createPeerConnection(targetUserId);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    this.socket.emit('rtc-offer', { target: targetUserId, offer, from: this.userId });
  }

  sendMessage(targetUserId, message) {
    const peerConnection = this.peerConnections.get(targetUserId);
    if (peerConnection?.dataChannel?.readyState === 'open') {
      peerConnection.dataChannel.send(JSON.stringify(message));
      return true;
    }
    return false;
  }
}

export default RTCManager;
