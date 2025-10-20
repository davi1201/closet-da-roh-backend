import { z } from 'zod';

export const ProductSchema = z
  .object({
    body: z.object({
      name: z.string().min(1, 'Name is required'),

      size: z.string().min(1, 'Informe o tamanho do produto'),

      description: z.string().optional().or(z.literal('')),
      color: z.string().optional().or(z.literal('')),
      category: z.string().optional().or(z.literal('')),

      buy_price: z
        .string()
        .min(1, 'O preço de compra é obrigatório')
        .transform((val) => Number(val)) // Converte para número
        .refine(
          (val) => !isNaN(val) && val >= 1,
          'O preço de compra deve ser um número positivo'
        ),

      sale_price: z
        .string()
        .min(1, 'O preço de venda é obrigatório')
        .transform((val) => Number(val)) // Converte para número
        .refine(
          (val) => !isNaN(val) && val >= 1,
          'O preço de venda deve ser um número positivo'
        ),

      is_available: z
        .string()
        .optional() // Chega como string do form
        .transform((val) => val === 'true' || val === '1'), // Transforma em boolean

      images: z.array(z.string().url()).optional(), // Se você for validar URLs
    }),
  })
  // O .superRefine agora usará os números transformados
  .superRefine((data, ctx) => {
    const { buy_price, sale_price } = data.body;

    // Verifica se a transformação foi bem sucedida antes de comparar
    if (
      typeof buy_price === 'number' &&
      typeof sale_price === 'number' &&
      buy_price > sale_price
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O preço de compra não pode ser maior que o preço de venda.',
        path: ['body', 'buy_price'],
      });

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O preço de venda deve ser maior ou igual ao preço de compra.',
        path: ['body', 'sale_price'],
      });
    }
  });
