"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv = __importStar(require("dotenv"));
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
dotenv.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const PORT = process.env.PORT || 3000;
const uri = process.env.NEO4J_URI || '';
const user = process.env.NEO4J_USER || '';
const password = process.env.NEO4J_PASSWORD || '';
const driver = neo4j_driver_1.default.driver(uri, neo4j_driver_1.default.auth.basic(user, password));
async function testConnection() {
    try {
        const session = driver.session();
        const result = await session.run('RETURN 1 AS result');
        console.log('Neo4j Aura Connected Successfully:', result.records[0].get('result'));
        await session.close();
    }
    catch (error) {
        console.error('Failed to connect to Neo4j Aura:', error);
    }
}
app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'online',
        engine: 'Cross-Border Supply Chain & Tax Risk Shield'
    });
});
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await testConnection();
});
