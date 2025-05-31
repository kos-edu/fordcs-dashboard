class StateMachineDashboard {
            constructor() {
                this.isMonitoring = false;
                this.refreshInterval = null;
                this.currentData = null;
                this.stateChangeTime = null;
                this.lastKnownState = null;
                
                // Mock data structure for demonstration
                this.mockData = {
                    status: {
                        currentState: 'RUNNING',
                        timestamp: Date.now(),
                        possibleStates: ['PAUSED', 'STOPPED', 'ERROR'],
                        metadata: {
                            uptime: 3600,
                            processId: '12345',
                            version: '1.2.3'
                        }
                    },
                    states: [
                        { id: 'IDLE', name: 'Idle', description: 'System is idle and ready' },
                        { id: 'RUNNING', name: 'Running', description: 'System is actively processing' },
                        { id: 'PAUSED', name: 'Paused', description: 'System is temporarily paused' },
                        { id: 'STOPPED', name: 'Stopped', description: 'System has been stopped' },
                        { id: 'ERROR', name: 'Error', description: 'System encountered an error' }
                    ],
                    events: [
                        { id: 'START', name: 'Start', description: 'Begin processing' },
                        { id: 'PAUSE', name: 'Pause', description: 'Temporarily halt processing' },
                        { id: 'STOP', name: 'Stop', description: 'Stop all processing' },
                        { id: 'RESET', name: 'Reset', description: 'Reset to initial state' },
                        { id: 'RESTART', name: 'Restart', description: 'Stop and start again' }
                    ]
                };
            }

            async fetchData(url, mockData = null) {
                try {
                    // For demo purposes, we'll use mock data if the URL contains placeholder
                    if (url.includes('jsonplaceholder.typicode.com') || url.includes('localhost') || url.includes('127.0.0.1')) {
                        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
                        return mockData || { data: 'mock response' };
                    }
                    
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        mode: 'cors' // Handle CORS
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    return await response.json();
                } catch (error) {
                    console.error('Fetch error:', error);
                    throw error;
                }
            }

            async fetchStatus() {
                const endpoint = document.getElementById('statusEndpoint').value;
                if (!endpoint) throw new Error('Status endpoint not configured');
                
                const data = await this.fetchData(endpoint, this.mockData.status);
                
                // Adapt the response to our expected format
                return {
                    currentState: data.currentState || 'UNKNOWN',
                    timestamp: data.timestamp || Date.now(),
                    possibleStates: data.possibleStates || [],
                    metadata: data.metadata || {}
                };
            }

            async fetchStates() {
                const endpoint = document.getElementById('statesEndpoint').value;
                if (!endpoint) throw new Error('States endpoint not configured');
                
                const data = await this.fetchData(endpoint, this.mockData.states);
                
                // Handle different response formats
                if (Array.isArray(data)) {
                    return data.map(item => ({
                        id: item.id || item.title || item.name,
                        name: item.name || item.title,
                        description: item.description || item.body || 'No description available'
                    }));
                }
                
                return this.mockData.states;
            }

            async fetchEvents() {
                const endpoint = document.getElementById('eventsEndpoint').value;
                if (!endpoint) throw new Error('Events endpoint not configured');
                
                const data = await this.fetchData(endpoint, this.mockData.events);
                
                // Handle different response formats
                if (Array.isArray(data)) {
                    return data.slice(0, 10).map(item => ({ // Limit to 10 items
                        id: item.id || item.name,
                        name: item.name || item.email || `Event ${item.id}`,
                        description: item.description || item.body || 'No description available'
                    }));
                }
                
                return this.mockData.events;
            }

            updateConnectionStatus(status, message) {
                const indicator = document.getElementById('connectionIndicator');
                const text = document.getElementById('connectionText');
                
                indicator.className = `status-indicator status-${status}`;
                text.textContent = message;
            }

            updateCurrentState(statusData) {
                const currentStateElement = document.getElementById('currentState');
                const lastUpdatedElement = document.getElementById('lastUpdated');
                const durationElement = document.getElementById('stateDuration');
                
                // Update state display
                currentStateElement.textContent = statusData.currentState;
                currentStateElement.className = `current-state state-${statusData.currentState.toLowerCase()}`;
                
                // Update timestamp
                const now = new Date();
                lastUpdatedElement.textContent = now.toLocaleTimeString();
                
                // Calculate duration if state changed
                if (this.lastKnownState !== statusData.currentState) {
                    this.stateChangeTime = now;
                    this.lastKnownState = statusData.currentState;
                }
                
                if (this.stateChangeTime) {
                    const duration = Math.floor((now - this.stateChangeTime) / 1000);
                    durationElement.textContent = this.formatDuration(duration);
                }
            }

            updateStatesDisplay(states, currentState, possibleStates) {
                const statesContainer = document.getElementById('statesList');
                statesContainer.innerHTML = '';
                
                states.forEach(state => {
                    const stateElement = document.createElement('div');
                    stateElement.className = 'state-item';
                    
                    if (state.id === currentState) {
                        stateElement.classList.add('current');
                    } else if (possibleStates.includes(state.id)) {
                        stateElement.classList.add('possible');
                    } else {
                        stateElement.classList.add('disabled');
                    }
                    
                    stateElement.innerHTML = `
                        <div class="state-name">${state.name}</div>
                        <div class="state-description">${state.description}</div>
                    `;
                    
                    // Add click handler for possible states
                    if (possibleStates.includes(state.id)) {
                        stateElement.style.cursor = 'pointer';
                        stateElement.addEventListener('click', () => {
                            this.triggerStateTransition(state.id);
                        });
                    }
                    
                    statesContainer.appendChild(stateElement);
                });
            }

            updateEventsDisplay(events) {
                const eventsContainer = document.getElementById('eventsList');
                const eventSelector = document.getElementById('eventSelector');
                const triggerBtn = document.getElementById('triggerEventBtn');
                
                eventsContainer.innerHTML = '';
                eventSelector.innerHTML = '<option value="">Select an event...</option>';
                
                events.forEach(event => {
                    // Update events display
                    const eventElement = document.createElement('div');
                    eventElement.className = 'event-item';
                    eventElement.innerHTML = `
                        <div class="event-name">${event.name}</div>
                        <div class="event-description">${event.description}</div>
                    `;
                    
                    eventElement.addEventListener('click', () => {
                        eventSelector.value = event.id;
                        this.highlightSelectedEvent(event.id);
                    });
                    
                    eventsContainer.appendChild(eventElement);
                    
                    // Add to selector dropdown
                    const option = document.createElement('option');
                    option.value = event.id;
                    option.textContent = event.name;
                    eventSelector.appendChild(option);
                });
                
                // Enable controls if events are available
                eventSelector.disabled = events.length === 0;
                triggerBtn.disabled = events.length === 0;
            }

            highlightSelectedEvent(eventId) {
                // Remove previous highlights
                document.querySelectorAll('.event-item').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // Highlight selected event
                document.querySelectorAll('.event-item').forEach(item => {
                    if (item.querySelector('.event-name').textContent === 
                        document.querySelector(`option[value="${eventId}"]`)?.textContent) {
                        item.classList.add('selected');
                    }
                });
            }

            async triggerEvent(eventId, eventData = {}) {
                const endpoint = document.getElementById('eventsActionEndpoint').value;
                if (!endpoint) {
                    throw new Error('Events action endpoint not configured');
                }
                
                const payload = {
                    eventId: eventId,
                    timestamp: Date.now(),
                    ...eventData
                };
                
                try {
                    // For demo purposes with mock endpoints
                    if (endpoint.includes('jsonplaceholder.typicode.com')) {
                        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
                        return {
                            success: true,
                            message: `Event ${eventId} triggered successfully`,
                            timestamp: Date.now()
                        };
                    }
                    
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        mode: 'cors',
                        body: JSON.stringify(payload)
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const result = await response.json();
                    return result;
                    
                } catch (error) {
                    console.error('Event trigger error:', error);
                    throw error;
                }
            }

            async triggerSelectedEvent() {
                const eventSelector = document.getElementById('eventSelector');
                const selectedEventId = eventSelector.value;
                
                if (!selectedEventId) {
                    this.showMessage('Please select an event to trigger', 'error');
                    return;
                }
                
                const triggerBtn = document.getElementById('triggerEventBtn');
                const originalText = triggerBtn.textContent;
                
                try {
                    // Update button state
                    triggerBtn.disabled = true;
                    triggerBtn.textContent = 'Triggering...';
                    
                    // Get event details for display
                    const selectedOption = eventSelector.options[eventSelector.selectedIndex];
                    const eventName = selectedOption.textContent;
                    
                    // Trigger the event
                    const result = await this.triggerEvent(selectedEventId);
                    
                    this.showMessage(`Successfully triggered event: ${eventName}`, 'success');
                    
                    // Refresh data after a short delay to see state changes
                    setTimeout(() => {
                        if (this.isMonitoring) {
                            this.refreshData();
                        }
                    }, 1000);
                    
                } catch (error) {
                    this.showMessage(`Failed to trigger event: ${error.message}`, 'error');
                } finally {
                    // Restore button state
                    triggerBtn.disabled = false;
                    triggerBtn.textContent = originalText;
                }
            }

            showMessage(message, type = 'info') {
                // Remove existing messages
                const existingMessages = document.querySelectorAll('.trigger-success, .trigger-error');
                existingMessages.forEach(msg => msg.remove());
                
                // Create new message
                const messageDiv = document.createElement('div');
                messageDiv.className = type === 'success' ? 'trigger-success' : 'trigger-error';
                messageDiv.textContent = message;
                
                // Insert after event trigger section
                const triggerSection = document.querySelector('.event-trigger-section');
                triggerSection.parentNode.insertBefore(messageDiv, triggerSection.nextSibling);
                
                // Auto-remove after 5 seconds
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, 5000);
            }

            triggerStateTransition(stateId) {
                console.log(`Triggering transition to state: ${stateId}`);
                // Set the event selector if there's a corresponding event
                const eventSelector = document.getElementById('eventSelector');
                const matchingOption = Array.from(eventSelector.options).find(option => 
                    option.textContent.toLowerCase().includes(stateId.toLowerCase()) ||
                    option.value.toLowerCase().includes(stateId.toLowerCase())
                );
                
                if (matchingOption) {
                    eventSelector.value = matchingOption.value;
                    this.highlightSelectedEvent(matchingOption.value);
                }
            }

            formatDuration(seconds) {
                if (seconds < 60) return `${seconds}s`;
                if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
                return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
            }

            showError(message) {
                const container = document.getElementById('statesList');
                container.innerHTML = `<div class="error">Error: ${message}</div>`;
                
                const eventsContainer = document.getElementById('eventsList');
                eventsContainer.innerHTML = `<div class="error">Error: ${message}</div>`;
            }

            async refreshData() {
                if (!this.isMonitoring) return;
                
                try {
                    this.updateConnectionStatus('loading', 'Fetching data...');
                    
                    // Fetch all data concurrently
                    const [statusData, states, events] = await Promise.all([
                        this.fetchStatus(),
                        this.fetchStates(),
                        this.fetchEvents()
                    ]);
                    
                    // Update UI
                    this.updateCurrentState(statusData);
                    this.updateStatesDisplay(states, statusData.currentState, statusData.possibleStates);
                    this.updateEventsDisplay(events);
                    
                    this.updateConnectionStatus('connected', 'Connected');
                    
                    // Update last refresh time
                    document.getElementById('dataLastUpdated').textContent = 
                        `Last updated: ${new Date().toLocaleString()}`;
                    
                } catch (error) {
                    console.error('Error refreshing data:', error);
                    this.updateConnectionStatus('disconnected', `Error: ${error.message}`);
                    this.showError(error.message);
                }
            }

            startMonitoring() {
                if (this.isMonitoring) return;
                
                const interval = parseInt(document.getElementById('refreshInterval').value) * 1000;
                
                this.isMonitoring = true;
                this.refreshData(); // Initial fetch
                
                this.refreshInterval = setInterval(() => {
                    this.refreshData();
                }, interval);
                
                console.log(`Started monitoring with ${interval/1000}s interval`);
            }

            stopMonitoring() {
                if (!this.isMonitoring) return;
                
                this.isMonitoring = false;
                if (this.refreshInterval) {
                    clearInterval(this.refreshInterval);
                    this.refreshInterval = null;
                }
                
                this.updateConnectionStatus('disconnected', 'Monitoring stopped');
                console.log('Stopped monitoring');
            }
        }

        // Initialize dashboard
        const dashboard = new StateMachineDashboard();

        // Global functions for UI
        function startMonitoring() {
            dashboard.startMonitoring();
        }

        function stopMonitoring() {
            dashboard.stopMonitoring();
        }

        function refreshData() {
            dashboard.refreshData();
        }

        function triggerSelectedEvent() {
            dashboard.triggerSelectedEvent();
        }

        // Event listener for event selector change
        document.addEventListener('DOMContentLoaded', function() {
            const eventSelector = document.getElementById('eventSelector');
            eventSelector.addEventListener('change', function() {
                if (this.value) {
                    dashboard.highlightSelectedEvent(this.value);
                } else {
                    // Remove all highlights
                    document.querySelectorAll('.event-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                }
            });
        });

        // Auto-start with mock data for demonstration
        setTimeout(() => {
            dashboard.startMonitoring();
        }, 1000);
    