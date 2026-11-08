export const loadRazorpay = () => {
  return new Promise(resolve => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => {
      resolve(window.Razorpay)
    }
    script.onerror = () => {
      resolve(null)
    }
    document.body.appendChild(script)
  })
}
