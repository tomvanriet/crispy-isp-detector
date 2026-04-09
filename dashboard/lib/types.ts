export interface Collector {
  id: string
  name: string
  isp: string
  location: string
  created_at: string
}

export interface PingResult {
  id: string
  collector_id: string
  target_host: string
  target_label: string
  target_region: string
  rtt_min: number
  rtt_avg: number
  rtt_max: number
  rtt_mdev: number
  packet_loss: number
  packets_sent: number
  packets_received: number
  created_at: string
}

export interface SpeedResult {
  id: string
  collector_id: string
  download_mbps: number
  upload_mbps: number
  ping_ms: number
  server_name: string
  created_at: string
}

export interface TracerouteResult {
  id: string
  collector_id: string
  target_host: string
  target_label: string
  target_region: string
  hop_number: number
  hop_ip: string
  hop_hostname: string
  rtt_avg: number
  packet_loss: number
  created_at: string
}

// Chart-ready types
export interface PingChartPoint {
  time: string
  [region: string]: string | number
}

export interface SpeedChartPoint {
  time: string
  download: number
  upload: number
}
