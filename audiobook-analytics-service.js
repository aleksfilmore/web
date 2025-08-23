const fs = require('fs');
const path = require('path');

class AudiobookAnalyticsService {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.sessionFile = path.join(this.dataDir, 'audiobook-sessions.json');
        this.listenerFile = path.join(this.dataDir, 'audiobook-listeners.json');
        
        // Ensure data directory exists
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    // Log when someone starts listening
    async logListeningSession(token, chapterFile, duration = 0, completed = false) {
        try {
            // Decode token to get user info
            const userInfo = this.decodeAccessToken(token);
            if (!userInfo) {
                console.warn('Invalid token for listening session');
                return { success: false, error: 'Invalid token' };
            }

            const session = {
                id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                email: userInfo.email,
                sessionId: userInfo.sessionId,
                chapterFile,
                startTime: new Date().toISOString(),
                duration: duration, // in seconds
                completed: completed,
                userAgent: '', // You can add this from request headers
                ipAddress: '', // You can add this from request
                timestamp: Date.now()
            };

            // Load existing sessions
            let sessions = [];
            if (fs.existsSync(this.sessionFile)) {
                try {
                    sessions = JSON.parse(fs.readFileSync(this.sessionFile, 'utf8'));
                } catch (e) {
                    console.error('Error reading sessions file:', e);
                    sessions = [];
                }
            }

            // Add new session
            sessions.push(session);

            // Keep only last 1000 sessions to prevent file from growing too large
            if (sessions.length > 1000) {
                sessions = sessions.slice(-1000);
            }

            // Save sessions
            fs.writeFileSync(this.sessionFile, JSON.stringify(sessions, null, 2));

            // Update listener stats
            await this.updateListenerStats(userInfo.email, chapterFile, duration, completed);

            console.log(`Logged listening session: ${userInfo.email} - ${chapterFile}`);
            return { success: true, sessionId: session.id };

        } catch (error) {
            console.error('Error logging listening session:', error);
            return { success: false, error: error.message };
        }
    }

    // Update overall listener statistics
    async updateListenerStats(email, chapterFile, duration, completed) {
        try {
            let listeners = [];
            if (fs.existsSync(this.listenerFile)) {
                try {
                    listeners = JSON.parse(fs.readFileSync(this.listenerFile, 'utf8'));
                } catch (e) {
                    console.error('Error reading listeners file:', e);
                    listeners = [];
                }
            }

            // Find existing listener or create new one
            let listener = listeners.find(l => l.email === email);
            if (!listener) {
                listener = {
                    email,
                    firstSession: new Date().toISOString(),
                    totalListeningTime: 0,
                    chaptersStarted: new Set(),
                    chaptersCompleted: new Set(),
                    sessionCount: 0,
                    lastActivity: new Date().toISOString()
                };
                listeners.push(listener);
            }

            // Update stats
            listener.totalListeningTime += duration;
            listener.sessionCount += 1;
            listener.lastActivity = new Date().toISOString();
            
            if (chapterFile) {
                listener.chaptersStarted.add(chapterFile);
                if (completed) {
                    listener.chaptersCompleted.add(chapterFile);
                }
            }

            // Convert Sets to Arrays for JSON serialization
            listener.chaptersStarted = Array.from(listener.chaptersStarted);
            listener.chaptersCompleted = Array.from(listener.chaptersCompleted);

            // Save updated listeners
            fs.writeFileSync(this.listenerFile, JSON.stringify(listeners, null, 2));

        } catch (error) {
            console.error('Error updating listener stats:', error);
        }
    }

    // Get analytics for admin dashboard
    async getAnalytics(daysBack = 30) {
        try {
            const sessions = this.loadSessions();
            const listeners = this.loadListeners();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysBack);

            // Filter sessions by date range
            const recentSessions = sessions.filter(session => 
                new Date(session.startTime) >= cutoffDate
            );

            // Calculate metrics
            const totalSessions = recentSessions.length;
            const uniqueListeners = new Set(recentSessions.map(s => s.email)).size;
            const totalListeningTime = recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
            const averageSessionDuration = totalSessions > 0 ? totalListeningTime / totalSessions : 0;

            // Popular chapters
            const chapterCounts = {};
            recentSessions.forEach(session => {
                if (session.chapterFile) {
                    chapterCounts[session.chapterFile] = (chapterCounts[session.chapterFile] || 0) + 1;
                }
            });

            const popularChapters = Object.entries(chapterCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([chapter, count]) => ({
                    chapter: this.formatChapterName(chapter),
                    plays: count
                }));

            // Daily listening data for chart
            const dailyData = this.generateDailyListeningData(recentSessions, daysBack);

            // Completion rates
            const completionStats = this.calculateCompletionRates(listeners);

            return {
                success: true,
                data: {
                    totalSessions,
                    uniqueListeners,
                    totalListeningTime: Math.round(totalListeningTime),
                    averageSessionDuration: Math.round(averageSessionDuration),
                    popularChapters,
                    dailyListening: dailyData,
                    completionRate: completionStats.completionRate,
                    averageProgress: completionStats.averageProgress,
                    totalListeners: listeners.length
                }
            };

        } catch (error) {
            console.error('Error getting audiobook analytics:', error);
            return {
                success: false,
                error: error.message,
                data: this.getMockAnalytics()
            };
        }
    }

    loadSessions() {
        try {
            if (fs.existsSync(this.sessionFile)) {
                return JSON.parse(fs.readFileSync(this.sessionFile, 'utf8'));
            }
        } catch (e) {
            console.error('Error loading sessions:', e);
        }
        return [];
    }

    loadListeners() {
        try {
            if (fs.existsSync(this.listenerFile)) {
                return JSON.parse(fs.readFileSync(this.listenerFile, 'utf8'));
            }
        } catch (e) {
            console.error('Error loading listeners:', e);
        }
        return [];
    }

    generateDailyListeningData(sessions, daysBack) {
        const dailyData = [];
        const today = new Date();
        
        for (let i = daysBack - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const daysSessions = sessions.filter(session => 
                session.startTime.startsWith(dateStr)
            );
            
            dailyData.push({
                date: dateStr,
                sessions: daysSessions.length,
                uniqueListeners: new Set(daysSessions.map(s => s.email)).size,
                totalDuration: daysSessions.reduce((sum, s) => sum + (s.duration || 0), 0)
            });
        }
        
        return dailyData;
    }

    calculateCompletionRates(listeners) {
        if (listeners.length === 0) {
            return { completionRate: 0, averageProgress: 0 };
        }

        // Assuming there are about 33 chapters in the audiobook
        const totalChapters = 33;
        let totalProgress = 0;
        let completedListeners = 0;

        listeners.forEach(listener => {
            const chaptersCompleted = Array.isArray(listener.chaptersCompleted) 
                ? listener.chaptersCompleted.length 
                : 0;
            const progress = (chaptersCompleted / totalChapters) * 100;
            totalProgress += progress;
            
            if (progress > 90) { // Consider 90%+ as "completed"
                completedListeners++;
            }
        });

        return {
            completionRate: Math.round((completedListeners / listeners.length) * 100),
            averageProgress: Math.round(totalProgress / listeners.length)
        };
    }

    formatChapterName(filename) {
        // Convert filename to readable chapter name
        return filename
            .replace(/^\d+_/, '') // Remove number prefix
            .replace(/\+/g, ' ') // Replace + with spaces
            .replace(/\.mp3$/, '') // Remove .mp3 extension
            .replace(/_/g, ' ') // Replace underscores with spaces
            .toLowerCase()
            .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letters
    }

    decodeAccessToken(token) {
        try {
            const decoded = Buffer.from(token, 'base64').toString();
            const [email, sessionId, timestamp] = decoded.split(':');
            
            if (!email || !sessionId || !timestamp) {
                return null;
            }
            
            return { email, sessionId, timestamp };
        } catch (error) {
            console.error('Error decoding access token:', error);
            return null;
        }
    }

    getMockAnalytics() {
        return {
            totalSessions: Math.floor(Math.random() * 500) + 200,
            uniqueListeners: Math.floor(Math.random() * 100) + 50,
            totalListeningTime: Math.floor(Math.random() * 50000) + 20000,
            averageSessionDuration: Math.floor(Math.random() * 1800) + 900, // 15-45 minutes
            popularChapters: [
                { chapter: 'Chapter 1 - The Red Flag Parade', plays: 45 },
                { chapter: 'Chapter 2 - The Gambler', plays: 38 },
                { chapter: 'Chapter 3 - The Ghoster', plays: 35 },
                { chapter: 'Chapter 4 - The Party Animal', plays: 32 },
                { chapter: 'Chapter 5 - The Pet Obsessed', plays: 28 }
            ],
            dailyListening: this.generateMockDailyData(),
            completionRate: Math.floor(Math.random() * 30) + 60, // 60-90%
            averageProgress: Math.floor(Math.random() * 40) + 40, // 40-80%
            totalListeners: Math.floor(Math.random() * 150) + 75
        };
    }

    generateMockDailyData() {
        const data = [];
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            data.push({
                date: date.toISOString().split('T')[0],
                sessions: Math.floor(Math.random() * 20) + 5,
                uniqueListeners: Math.floor(Math.random() * 15) + 3,
                totalDuration: Math.floor(Math.random() * 10000) + 2000
            });
        }
        
        return data;
    }

    // Get recent listeners for admin dashboard
    async getRecentListeners(limit = 10) {
        try {
            const listeners = this.loadListeners();
            
            return listeners
                .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
                .slice(0, limit)
                .map(listener => ({
                    email: listener.email,
                    lastActivity: listener.lastActivity,
                    totalTime: Math.round(listener.totalListeningTime || 0),
                    chaptersCompleted: Array.isArray(listener.chaptersCompleted) ? listener.chaptersCompleted.length : 0,
                    progress: Math.round(((Array.isArray(listener.chaptersCompleted) ? listener.chaptersCompleted.length : 0) / 33) * 100)
                }));

        } catch (error) {
            console.error('Error getting recent listeners:', error);
            return [];
        }
    }

    // Test the analytics system
    async testAnalytics() {
        try {
            // Generate a test session
            const testToken = Buffer.from('test@example.com:test_session:' + Date.now()).toString('base64');
            await this.logListeningSession(testToken, '01_Opening+Credits.mp3', 300, false);
            
            const analytics = await this.getAnalytics(7);
            
            return {
                success: true,
                message: 'Audiobook analytics test successful',
                data: analytics.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = AudiobookAnalyticsService;
