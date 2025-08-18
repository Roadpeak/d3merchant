// FINAL FIX: Enhanced slot generation service with working days compatibility
// This handles BOTH capitalized AND lowercase working days formats

const moment = require('moment');
const { Op } = require('sequelize');

class SlotGenerationService {
  constructor(models) {
    this.models = models;
  }

  /**
   * FIXED: Enhanced working days validation that handles ANY format
   */
  validateDateAndStore(date, store) {
    const targetDate = moment(date, 'YYYY-MM-DD');
    
    if (!targetDate.isValid()) {
      return { isValid: false, message: 'Invalid date format' };
    }

    if (targetDate.isBefore(moment().startOf('day'))) {
      return { isValid: false, message: 'Cannot book slots for past dates' };
    }

    // Get the target day name
    const dayOfWeek = targetDate.format('dddd'); // e.g., "Monday"
    let workingDays = store.working_days;
    
    console.log('🔍 ENHANCED VALIDATION DEBUG:', {
      storeId: store.id,
      storeName: store.name,
      targetDate: date,
      dayOfWeek: dayOfWeek,
      rawWorkingDays: workingDays,
      workingDaysType: typeof workingDays
    });

    // FIXED: Handle multiple working days formats
    if (!workingDays) {
      console.error('❌ No working_days defined for store');
      return { 
        isValid: false, 
        message: `Store working days not configured`,
        debug: { error: 'no_working_days_defined' }
      };
    }

    // Parse working days from different possible formats
    let parsedWorkingDays = [];
    
    if (Array.isArray(workingDays)) {
      // Already an array
      parsedWorkingDays = workingDays;
      console.log('✅ Working days already an array:', parsedWorkingDays);
    } else if (typeof workingDays === 'string') {
      try {
        // Try to parse as JSON
        parsedWorkingDays = JSON.parse(workingDays);
        console.log('✅ Parsed working days from JSON string:', parsedWorkingDays);
      } catch (e) {
        // If JSON parsing fails, try comma-separated
        parsedWorkingDays = workingDays.split(',').map(day => day.trim());
        console.log('✅ Parsed working days from comma-separated:', parsedWorkingDays);
      }
    }

    // Ensure we have an array
    if (!Array.isArray(parsedWorkingDays)) {
      console.error('❌ Could not parse working days into array:', workingDays);
      return { 
        isValid: false, 
        message: `Store working days configuration error`,
        debug: {
          error: 'working_days_not_parseable',
          received: workingDays,
          type: typeof workingDays
        }
      };
    }

    // Remove empty values
    parsedWorkingDays = parsedWorkingDays.filter(day => day && day.toString().trim());

    if (parsedWorkingDays.length === 0) {
      console.error('❌ No valid working days found after parsing');
      return { 
        isValid: false, 
        message: `Store has no working days configured`,
        debug: { error: 'no_valid_working_days_after_parsing' }
      };
    }

    console.log('🔍 Final parsed working days:', parsedWorkingDays);

    // FIXED: SUPER FLEXIBLE day matching - handles ANY case and format
    const dayMatches = parsedWorkingDays.some(workingDay => {
      if (!workingDay) return false;
      
      const workingDayStr = workingDay.toString().toLowerCase().trim();
      const targetDayStr = dayOfWeek.toLowerCase().trim();
      
      console.log(`🔍 Comparing: "${workingDayStr}" vs "${targetDayStr}"`);
      
      // Method 1: Exact match (case-insensitive)
      if (workingDayStr === targetDayStr) {
        console.log('✅ EXACT MATCH found:', workingDayStr, '===', targetDayStr);
        return true;
      }
      
      // Method 2: Short form matching (mon, tue, wed, etc.)
      const workingDayShort = workingDayStr.substring(0, 3);
      const targetDayShort = targetDayStr.substring(0, 3);
      
      if (workingDayShort === targetDayShort) {
        console.log('✅ SHORT FORM MATCH found:', workingDayShort, '===', targetDayShort);
        return true;
      }
      
      // Method 3: Check if working day contains target day
      if (workingDayStr.includes(targetDayStr)) {
        console.log('✅ CONTAINS MATCH found:', workingDayStr, 'contains', targetDayStr);
        return true;
      }
      
      // Method 4: Check if target day contains working day
      if (targetDayStr.includes(workingDayStr)) {
        console.log('✅ REVERSE CONTAINS MATCH found:', targetDayStr, 'contains', workingDayStr);
        return true;
      }
      
      console.log('❌ No match for:', workingDayStr, 'vs', targetDayStr);
      return false;
    });

    if (!dayMatches) {
      console.error('❌ FINAL VALIDATION FAILED:', {
        targetDay: dayOfWeek,
        parsedWorkingDays: parsedWorkingDays,
        storeId: store.id,
        storeName: store.name
      });
      
      // Format working days for user-friendly message
      const formattedWorkingDays = parsedWorkingDays.map(day => {
        const dayStr = day.toString().trim();
        return dayStr.charAt(0).toUpperCase() + dayStr.slice(1).toLowerCase();
      }).join(', ');
      
      const targetDayFormatted = dayOfWeek;
      
      return { 
        isValid: false, 
        message: `Store is closed on ${targetDayFormatted}. Open days: ${formattedWorkingDays}`,
        workingDays: parsedWorkingDays,
        targetDay: dayOfWeek,
        debug: {
          targetDay: dayOfWeek,
          parsedWorkingDays: parsedWorkingDays,
          comparisonResults: parsedWorkingDays.map(day => ({
            workingDay: day,
            lowerCase: day.toString().toLowerCase(),
            targetLower: dayOfWeek.toLowerCase(),
            exactMatch: day.toString().toLowerCase() === dayOfWeek.toLowerCase(),
            shortMatch: day.toString().toLowerCase().substring(0, 3) === dayOfWeek.toLowerCase().substring(0, 3)
          }))
        }
      };
    }

    console.log('✅ VALIDATION PASSED for', dayOfWeek, 'against working days:', parsedWorkingDays);
    return { 
      isValid: true, 
      workingDays: parsedWorkingDays,
      targetDay: dayOfWeek 
    };
  }

  /**
   * Generate available time slots for a service/offer on a specific date
   */
  async generateAvailableSlots(entityId, entityType = 'offer', date, options = {}) {
    try {
      console.log(`🕒 ENHANCED: Generating slots for ${entityType} ${entityId} on ${date}`);

      // Get entity details (service or offer)
      const entity = await this.getEntityDetails(entityId, entityType);
      if (!entity) {
        throw new Error(`${entityType} not found`);
      }

      // Get the underlying service (for offers, get the linked service)
      const service = entityType === 'offer' ? entity.service : entity;
      if (!service) {
        throw new Error('Associated service not found');
      }

      // Get store details
      const store = service.store || await this.models.Store.findByPk(service.store_id);
      if (!store) {
        throw new Error('Store not found');
      }

      console.log(`🏪 Store: ${store.name}`);
      console.log(`⚙️ Service: ${service.name} (${service.duration}min)`);
      console.log(`📅 Store working days:`, store.working_days);

      // ENHANCED: Use the new flexible validation
      const validationResult = this.validateDateAndStore(date, store);
      if (!validationResult.isValid) {
        console.log('❌ ENHANCED Validation failed:', validationResult);
        return {
          success: false,
          businessRuleViolation: true,
          message: validationResult.message,
          availableSlots: [],
          storeInfo: this.formatStoreInfo(store),
          entityInfo: this.formatEntityInfo(entity, entityType),
          debug: validationResult.debug || null
        };
      }

      console.log('✅ ENHANCED Validation passed - generating slots...');

      // Generate base time slots
      const baseSlots = this.generateBaseSlots(service, store);
      console.log(`📋 Generated ${baseSlots.length} base slots`);

      // Get existing bookings
      const existingBookings = await this.getExistingBookings(service, date);
      console.log(`📅 Found ${existingBookings.length} existing bookings`);

      // Calculate slot availability
      const slotsWithAvailability = this.calculateSlotAvailability(
        baseSlots, 
        existingBookings, 
        service
      );

      // Format slots for frontend
      const formattedSlots = slotsWithAvailability
        .filter(slot => slot.available > 0)
        .map(slot => ({
          time: moment(slot.startTime, 'HH:mm').format('h:mm A'),
          startTime: slot.startTime,
          endTime: slot.endTime,
          available: slot.available,
          total: service.max_concurrent_bookings || 1,
          booked: (service.max_concurrent_bookings || 1) - slot.available,
          isAvailable: slot.available > 0
        }));

      console.log(`✅ ENHANCED: ${formattedSlots.length} available slots generated successfully`);

      return {
        success: true,
        availableSlots: formattedSlots.map(slot => slot.time),
        detailedSlots: formattedSlots,
        storeInfo: this.formatStoreInfo(store),
        entityInfo: this.formatEntityInfo(entity, entityType),
        bookingRules: {
          maxConcurrentBookings: service.max_concurrent_bookings || 1,
          serviceDuration: service.duration,
          bufferTime: service.buffer_time || 0,
          minAdvanceBooking: service.min_advance_booking || 30,
          maxAdvanceBooking: service.max_advance_booking || 10080
        },
        accessFee: entityType === 'offer' ? 5.99 : 0,
        debug: {
          totalBaseSlots: baseSlots.length,
          existingBookings: existingBookings.length,
          availableSlots: formattedSlots.length,
          storeWorkingDays: validationResult.workingDays,
          targetDay: validationResult.targetDay,
          validationPassed: true
        }
      };

    } catch (error) {
      console.error('💥 ENHANCED Slot generation error:', error);
      return {
        success: false,
        message: error.message || 'Failed to generate time slots',
        availableSlots: [],
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  /**
   * Get entity details (service or offer)
   */
  async getEntityDetails(entityId, entityType) {
    const includeService = {
      model: this.models.Service,
      as: 'service',
      include: [{
        model: this.models.Store,
        as: 'store'
      }]
    };

    if (entityType === 'offer') {
      return await this.models.Offer.findByPk(entityId, {
        include: [includeService]
      });
    } else {
      return await this.models.Service.findByPk(entityId, {
        include: [{
          model: this.models.Store,
          as: 'store'
        }]
      });
    }
  }

  /**
   * Generate base time slots based on store hours and service duration
   */
  generateBaseSlots(service, store) {
    const slots = [];
    const serviceDuration = service.duration || 60;
    const slotInterval = serviceDuration; // Use service duration as interval
    const bufferTime = service.buffer_time || 0;
    
    const openingTime = moment(store.opening_time, ['HH:mm:ss', 'HH:mm']);
    const closingTime = moment(store.closing_time, ['HH:mm:ss', 'HH:mm']);

    if (!openingTime.isValid() || !closingTime.isValid()) {
      console.warn('❌ Invalid store hours:', { opening: store.opening_time, closing: store.closing_time });
      return [];
    }

    console.log('🕐 Store hours:', {
      opening: openingTime.format('HH:mm'),
      closing: closingTime.format('HH:mm'),
      serviceDuration: serviceDuration,
      bufferTime: bufferTime
    });

    // Calculate the last possible slot start time
    const lastSlotStartTime = closingTime.clone().subtract(serviceDuration, 'minutes');
    
    let currentSlotTime = openingTime.clone();

    while (currentSlotTime.isSameOrBefore(lastSlotStartTime)) {
      const slotEndTime = currentSlotTime.clone().add(serviceDuration, 'minutes');
      
      // Make sure slot doesn't go past closing time
      if (slotEndTime.isAfter(closingTime)) {
        console.log('⏰ Slot would exceed closing time, stopping generation');
        break;
      }

      slots.push({
        startTime: currentSlotTime.format('HH:mm'),
        endTime: slotEndTime.format('HH:mm'),
        available: service.max_concurrent_bookings || 1,
        bookings: []
      });

      // Move to next slot
      currentSlotTime.add(slotInterval + bufferTime, 'minutes');
    }

    console.log(`📋 Generated ${slots.length} base slots`);
    return slots;
  }

  /**
   * Get existing bookings for a service and all its offers on a specific date
   */
  async getExistingBookings(service, date) {
    const startOfDay = moment(date).startOf('day').toDate();
    const endOfDay = moment(date).endOf('day').toDate();

    try {
      // Get all offers for this service
      const offers = await this.models.Offer.findAll({
        where: { service_id: service.id },
        attributes: ['id']
      });
      
      const offerIds = offers.map(offer => offer.id);

      console.log(`🔍 Checking bookings for service ${service.id} and ${offerIds.length} offers`);

      // Get bookings for both direct service bookings AND offer bookings
      const bookings = await this.models.Booking.findAll({
        where: {
          startTime: {
            [Op.gte]: startOfDay,
            [Op.lte]: endOfDay,
          },
          status: { [Op.not]: 'cancelled' },
          [Op.or]: [
            { serviceId: service.id },
            { offerId: { [Op.in]: offerIds } }
          ]
        },
        attributes: ['startTime', 'endTime', 'serviceId', 'offerId', 'status'],
        order: [['startTime', 'ASC']]
      });

      console.log(`📊 Found ${bookings.length} existing bookings`);
      return bookings;
    } catch (error) {
      console.error('❌ Error fetching existing bookings:', error);
      return [];
    }
  }

  /**
   * Calculate slot availability considering existing bookings and concurrent limits
   */
  calculateSlotAvailability(baseSlots, existingBookings, service) {
    return baseSlots.map(slot => {
      const slotStart = moment(`2023-01-01 ${slot.startTime}`);
      const slotEnd = moment(`2023-01-01 ${slot.endTime}`);

      // Find overlapping bookings
      const overlappingBookings = existingBookings.filter(booking => {
        const bookingStart = moment(booking.startTime);
        const bookingEnd = moment(booking.endTime);

        // Check for overlap
        return bookingStart.isBefore(slotEnd) && bookingEnd.isAfter(slotStart);
      });

      const bookedCount = overlappingBookings.length;
      const maxConcurrent = service.max_concurrent_bookings || 1;
      const available = Math.max(0, maxConcurrent - bookedCount);

      return {
        ...slot,
        available,
        booked: bookedCount,
        bookings: overlappingBookings
      };
    });
  }

  /**
   * ENHANCED: Format store information with flexible working days parsing
   */
  formatStoreInfo(store) {
    let workingDays = [];
    
    // Parse working days flexibly
    if (Array.isArray(store.working_days)) {
      workingDays = store.working_days;
    } else if (typeof store.working_days === 'string') {
      try {
        workingDays = JSON.parse(store.working_days);
      } catch (e) {
        workingDays = store.working_days.split(',').map(day => day.trim());
      }
    }
    
    // Ensure proper format
    workingDays = workingDays
      .filter(day => day && day.toString().trim())
      .map(day => {
        const dayStr = day.toString().trim();
        return dayStr.charAt(0).toUpperCase() + dayStr.slice(1).toLowerCase();
      });

    return {
      name: store.name,
      location: store.location,
      openingTime: moment(store.opening_time, 'HH:mm').format('h:mm A'),
      closingTime: moment(store.closing_time, 'HH:mm').format('h:mm A'),
      workingDays: workingDays
    };
  }

  /**
   * Format entity information for response
   */
  formatEntityInfo(entity, entityType) {
    if (entityType === 'offer') {
      return {
        type: 'offer',
        title: entity.title || entity.service?.name,
        description: entity.description,
        discount: entity.discount,
        originalPrice: entity.service?.price,
        discountedPrice: entity.service?.price ? 
          (entity.service.price * (1 - entity.discount / 100)).toFixed(2) : null,
        duration: entity.service?.duration,
        status: entity.status
      };
    } else {
      return {
        type: 'service',
        name: entity.name,
        price: entity.price,
        duration: entity.duration,
        status: entity.status
      };
    }
  }

  /**
   * ENHANCED: Debug method with comprehensive working days analysis
   */
  async debugOfferWorkingDays(offerId) {
    try {
      console.log('🐛 ENHANCED DEBUG: Analyzing offer working days setup for:', offerId);
      
      const offer = await this.models.Offer.findByPk(offerId, {
        include: [{
          model: this.models.Service,
          as: 'service',
          include: [{
            model: this.models.Store,
            as: 'store'
          }]
        }]
      });

      if (!offer) {
        return { error: 'Offer not found' };
      }

      const store = offer.service?.store;
      if (!store) {
        return { error: 'Store not found for offer' };
      }

      // Test the enhanced validation
      const testDates = [
        '2025-08-18', // Monday
        '2025-08-19', // Tuesday
        '2025-08-20', // Wednesday
        '2025-08-21', // Thursday
        '2025-08-22', // Friday
        '2025-08-23', // Saturday
        '2025-08-24'  // Sunday
      ];

      const validationResults = testDates.map(date => {
        const result = this.validateDateAndStore(date, store);
        const dayName = moment(date).format('dddd');
        return {
          date,
          dayName,
          isValid: result.isValid,
          message: result.message,
          debug: result.debug
        };
      });

      return {
        offer: {
          id: offer.id,
          title: offer.title,
          status: offer.status
        },
        service: {
          id: offer.service.id,
          name: offer.service.name,
          duration: offer.service.duration
        },
        store: {
          id: store.id,
          name: store.name,
          location: store.location,
          working_days: store.working_days,
          working_days_type: typeof store.working_days,
          working_days_is_array: Array.isArray(store.working_days),
          opening_time: store.opening_time,
          closing_time: store.closing_time,
          status: store.status
        },
        enhancedValidationResults: validationResults,
        recommendations: this.getEnhancedRecommendations(store, validationResults)
      };
    } catch (error) {
      console.error('🐛 Enhanced debug error:', error);
      return { error: error.message };
    }
  }

  /**
   * Get enhanced recommendations for fixing working days issues
   */
  getEnhancedRecommendations(store, validationResults) {
    const recommendations = [];
    const workingDays = store.working_days;

    if (!workingDays) {
      recommendations.push({
        issue: 'No working days defined',
        fix: 'Set working_days field to JSON array',
        sql: `UPDATE stores SET working_days = '["monday","tuesday","wednesday","thursday","friday","saturday"]' WHERE id = '${store.id}';`
      });
    } else {
      const failedDays = validationResults.filter(result => !result.isValid);
      const passedDays = validationResults.filter(result => result.isValid);
      
      if (failedDays.length > 0) {
        recommendations.push({
          issue: `Days that are failing validation: ${failedDays.map(d => d.dayName).join(', ')}`,
          fix: 'Current working days format may need adjustment',
          currentFormat: workingDays,
          suggestion: 'Ensure working days are in lowercase JSON array format'
        });
      }
      
      if (passedDays.length > 0) {
        recommendations.push({
          issue: 'Working validation',
          fix: `Days that pass validation: ${passedDays.map(d => d.dayName).join(', ')}`,
          status: 'SUCCESS'
        });
      }
    }

    return recommendations;
  }
}

module.exports = SlotGenerationService;