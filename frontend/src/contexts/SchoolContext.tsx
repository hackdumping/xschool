import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { schoolService } from '@/services/api';

interface SchoolSettings {
    name: string;
    email: string;
    phone: string;
    address: string;
    website: string;
    slogan: string;
    logo: string | null;
    enable_email_alerts: boolean;
    enable_sms_alerts: boolean;
    payment_reminder_days: number;
    low_grade_threshold: number;
    currency_symbol: string;
    currency_code: string;
    tranche_1_deadline: string;
    tranche_2_deadline: string;
    tranche_3_deadline: string;
    exam_fee_amount: number;
    enable_cash_payment: boolean;
    enable_mobile_payment: boolean;
    enable_bank_transfer: boolean;
    bank_details: string;
    receipt_footer: string;
    session_timeout: number;
    min_password_length: number;
    max_login_attempts: number;
    require_strong_password: boolean;
    maintenance_mode: boolean;
    two_factor_enforcement: boolean;
}

interface SchoolContextType {
    settings: SchoolSettings;
    loading: boolean;
    refreshSettings: () => Promise<void>;
    updateSettings: (data: Partial<SchoolSettings>) => Promise<void>;
}

const defaultSettings: SchoolSettings = {
    name: 'XSCHOOL Management',
    email: 'contact@xschool.cm',
    phone: '+237 699 00 11 22',
    address: 'Bastos, Yaoundé, Cameroun',
    website: 'https://vanda-studio.tech',
    slogan: 'EXCELLENCE & DISCIPLINE',
    logo: null,
    enable_email_alerts: true,
    enable_sms_alerts: false,
    payment_reminder_days: 3,
    low_grade_threshold: 10.00,
    currency_symbol: 'FCFA',
    currency_code: 'XAF',
    tranche_1_deadline: '2026-10-14',
    tranche_2_deadline: '2026-11-01',
    tranche_3_deadline: '2027-01-01',
    exam_fee_amount: 10000,
    enable_cash_payment: true,
    enable_mobile_payment: true,
    enable_bank_transfer: false,
    bank_details: '',
    receipt_footer: '',
    session_timeout: 30,
    min_password_length: 8,
    max_login_attempts: 5,
    require_strong_password: true,
    maintenance_mode: false,
    two_factor_enforcement: false,
};

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SchoolSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    const refreshSettings = useCallback(async () => {
        try {
            const response = await schoolService.getSettings();
            setSettings(response.data);
        } catch (error) {
            console.error('Failed to fetch school settings', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateSettings = async (data: Partial<SchoolSettings>) => {
        try {
            const response = await schoolService.updateSettings(data);
            setSettings(response.data);
        } catch (error) {
            console.error('Failed to update school settings', error);
            throw error;
        }
    };

    useEffect(() => {
        refreshSettings();
    }, [refreshSettings]);

    return (
        <SchoolContext.Provider value={{ settings, loading, refreshSettings, updateSettings }}>
            {children}
        </SchoolContext.Provider>
    );
};

export const useSchool = () => {
    const context = useContext(SchoolContext);
    if (context === undefined) {
        throw new Error('useSchool must be used within a SchoolProvider');
    }
    return context;
};
