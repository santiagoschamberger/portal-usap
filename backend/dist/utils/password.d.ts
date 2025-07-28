export declare const hashPassword: (password: string) => Promise<string>;
export declare const verifyPassword: (password: string, hash: string) => Promise<boolean>;
export declare const generateResetToken: () => string;
export declare const generateVerificationToken: () => string;
export declare const validatePasswordStrength: (password: string) => {
    valid: boolean;
    errors: string[];
};
export declare const generateTemporaryPassword: () => string;
//# sourceMappingURL=password.d.ts.map