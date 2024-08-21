import axios from 'axios'

const API_URL = 'http://localhost:3001/api'

export const fetchPosts = async () => {
    try {
        const response = await axios.get(`${API_URL}/posts`)
        return response.data
    } catch (err) {
        console.log('Error fetching posts:', err);
        throw err        
    }
}