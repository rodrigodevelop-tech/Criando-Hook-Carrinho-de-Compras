import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { idText } from 'typescript';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/stock/${productId}`);

      const { amount } = response.data;

      if(amount  > 0 ){

        const result = cart.filter((product)=> product.id === productId);

        if(result.length <= 0 ){
          const response = await api.get<Product>(`/products/${productId}`);

          const { 
            id,
            title,
            price,
            image,
          } = response.data;

          const product = {
            id,
            title,
            price,
            image,
            amount : 1
          }

          setCart([
            ...cart,
            product
          ]);

          const cartStorage = [
            ...cart,
            product
          ]

          localStorage.setItem('@RocketShoes:cart',JSON.stringify(cartStorage));

          toast.success('Produto adicionado ao carrinho!');

        }else{

          let totalAmountProduct = result[0]?.amount + 1;

          if(totalAmountProduct > amount){
            toast.error('Quantidade solicitada fora de estoque');
          }else{ 
            const cartEdited = cart.map((product)=> {
              if(product.id === productId){
                return {
                  ...product,
                  amount: product.amount + 1
                }
              }else
                return product
            });
  
            setCart(cartEdited);

            localStorage.setItem('@RocketShoes:cart',JSON.stringify(cartEdited));
  
            toast.success('Produto adicionado ao carrinho!');
          }

        }

      }else{
        toast.error('Quantidade solicitada fora de estoque');
      }

    } catch(error) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const productExists = cart.filter(product => product.id === productId);

      if(productExists.length <= 0){
        throw new Error();
      }

      const cartUpdated = cart.filter(product => product.id !== productId);

      setCart(cartUpdated);

      toast.success('Produto removido com sucesso');

      localStorage.setItem('@RocketShoes:cart',JSON.stringify(cartUpdated));

    } catch(error) {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(amount <= 0 )
        return;

      const productStok = await api.get<UpdateProductAmount>(`/stock/${productId}`);

      if(amount > productStok.data.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const cartUpdated = cart.map((product)=>{
        if(product.id === productId){
          return {
            ...product,
            amount: amount
          }
        }else
          return product;
      });

      setCart(cartUpdated);

      localStorage.setItem('@RocketShoes:cart',JSON.stringify(cartUpdated));
      

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
