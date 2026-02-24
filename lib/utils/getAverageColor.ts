/**
 * Calcola il colore medio (average) di un'immagine
 * @param imageSrc - URL dell'immagine
 * @returns Promise con il colore RGB in formato { r, g, b }
 */
export async function getAverageColor(imageSrc: string): Promise<{ r: number; g: number; b: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Impossibile ottenere il contesto canvas'))
          return
        }
        
        canvas.width = img.width
        canvas.height = img.height
        
        ctx.drawImage(img, 0, 0)
        
        // Campiona i pixel (ogni 10 pixel per performance)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        let r = 0
        let g = 0
        let b = 0
        let count = 0
        
        // Campiona ogni 10 pixel per migliorare le performance
        for (let i = 0; i < data.length; i += 40) {
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          count++
        }
        
        resolve({
          r: Math.round(r / count),
          g: Math.round(g / count),
          b: Math.round(b / count),
        })
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => {
      reject(new Error('Errore nel caricamento dell\'immagine'))
    }
    
    img.src = imageSrc
  })
}
