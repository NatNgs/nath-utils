const mask = 0xffffffff

function Random(seed) {
	seed = seed || (Math.random() - 0.5) * 99999999
	let m_w = (123456789 + seed) & mask
	let m_z = (987654321 - seed) & mask

	this.next = function (max = 1, min = 0) {
		m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask
		m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask
		let result = ((m_z << 16) + (m_w & 65535)) >>> 0
		result /= 4294967296
		return result * (max || 1 - (min = min || 0)) + min
	}
}
